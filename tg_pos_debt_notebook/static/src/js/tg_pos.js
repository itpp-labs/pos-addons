odoo.define('tg_pos_debt_notebook.tg_pos', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');

    var _t = core._t;

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            var partner_model = _.find(this.models, function(model){ return model.model === 'res.partner'; });
            partner_model.fields.push('debt');
            return _super_posmodel.initialize.call(this, session, attributes);
        },
        push_order: function(order, opts){
            var self = this;
            var pushed = _super_posmodel.push_order.call(this, order, opts);
            var client = order && order.get_client();
            if (client){
                order.paymentlines.each(function(line){
                    var journal = line.cashregister.journal;
                    if (!journal.debt)
                        return;
                    var amount = line.get_amount();
                    client.debt += amount;
                })
            }
            return pushed;
        }
    });

    models.Order = models.Order.extend({
        add_paymentline: function(cashregister) {
            this.assert_editable();

            var self = this;
            var journal = cashregister.journal;
            if (journal.debt && !this.get_client()){
                setTimeout(function(){
                    self.pos.gui.show_screen('clientlist');
                }, 30);
            }

            var newPaymentline = new models.Paymentline({},{order: this, cashregister: cashregister, pos: this.pos});
            if(cashregister.journal.type !== 'cash' || this.pos.config.iface_precompute_cash ||
                cashregister.journal.debt){
                newPaymentline.set_amount( Math.max(this.get_due(),0) );
            }
            this.paymentlines.add(newPaymentline);
            this.select_paymentline(newPaymentline);
        }
    });

    screens.PaymentScreenWidget.include({
        validate_order: function(options) {
            var currentOrder = this.pos.get_order();
            var isDebt = false;
            var plines = currentOrder.get_paymentlines();
            for (var i = 0; i < plines.length; i++) {
                if (plines[i].cashregister.journal.debt) {
                    isDebt = true;
                    break;
                }
            }

            if (isDebt && !currentOrder.get_client()){
                this.gui.show_popup('error',{
                    'title': _t('Unknown customer'),
                    'body': _t('You cannot use Debt payment. Select customer first.'),
                });
                return;
            }

            if(isDebt && currentOrder.get_orderlines().length === 0){
                this.gui.show_popup('error',{
                    'title': _t('Empty Order'),
                    'body': _t('There must be at least one product in your order before it can be validated. (Hint: you can use some dummy zero price product)'),
                });
                return;
            }

            this._super(options);
        },

        pay_full_debt: function(){
            var order = this.pos.get_order();

            var debtjournal = false;
            _.each(this.pos.cashregisters, function(cashregister) {
                if (cashregister.journal.debt) {
                    debtjournal = cashregister;
                }
            });

            var paymentLines = order.get_paymentlines();
            if (paymentLines.length) {
                _.each(paymentLines.models, function(paymentLine) {
                    if (paymentLine.cashregister.journal.debt){
                        paymentLine.destroy();
                    }
                });
            }

            var newDebtPaymentline = new models.Paymentline({},{order: order, cashregister: debtjournal, pos: this.pos});
            newDebtPaymentline.set_amount(order.get_client().debt * -1);
            order.paymentlines.add(newDebtPaymentline);
            this.render_paymentlines();
        },

        /* I inherit the native is_paid() method below for the following reason:
        without this inherit, if you have a customer with a debt and he comes
        to pay his debt without buying new items:
        1) cashier selects "debt journal"
        2) cashier selects the customer and clicks on "Select Customer and Pay Full Debt"
        3) a dummy product is automatically added to the pos order and
           the debt journal is selected with a negative amount corresponding
           to the debt.
           AT THAT MOMENT, the "Validate" button is active...
           so the cashier can click on it by accident !
           He should not, because he still has to select the payment method used
           to pay the debt.

        This problem is linked to the fact that the native is_paid() method
        returns with the following code:

        return (currentOrder.getTotalTaxIncluded() < 0.000001
                            || currentOrder.getPaidTotal() + 0.000001 >= currentOrder.getTotalTaxIncluded());

        (cf odoo/addons/point_of_sale/static/src/js/screens.js line 1256)

        So is_paid() always returns True when
        "currentOrder.getTotalTaxIncluded() < 0.000001" which is the case
        in this scenario with a pos.order with the dummy product with price = 0
        I must say that I don't understand what is the use case behind the
        "currentOrder.getTotalTaxIncluded() < 0.000001" */
        is_paid: function(){
            var currentOrder = this.pos.get_order();
            return (currentOrder.getPaidTotal() + 0.000001 >= currentOrder.getTotalTaxIncluded());
        },
        customer_changed: function() {
            var self = this;
            var client = this.pos.get_client();
            var debt = 0;
            if (client) {debt = Math.round(client.debt * 100) / 100;}
            this.$('.js_customer_name').text( client ? client.name + ' [Debt: ' + debt + ']' : _t('Customer') );


            var pay_full_debt = this.$('.pay-full-debt');
            pay_full_debt.on('click', function() {self.pay_full_debt();});
            if (debt) {
                pay_full_debt.removeClass('oe_hidden');
            } else {
                pay_full_debt.addClass('oe_hidden');
            }
        }
    });

    gui.Gui.prototype.screen_classes.filter(function(el) { return el.name == 'clientlist'})[0].widget.include({
        toggle_save_button: function(){
            this._super();
            var $button = this.$('.button.set-customer-pay-full-debt');
            if (this.editing_client) {
                $button.addClass('oe_hidden');
                return;
            } else if (this.new_client){
                if (this.new_client.debt > 0){
                    $button.toggleClass('oe_hidden',!this.has_client_changed());
                }else{
                	$button.addClass('oe_hidden');
                }
            }
        },

        show: function(){
            this._super();
            var self = this;
            this.$('.button.set-customer-pay-full-debt').click(function(){
                self.save_changes();
                self.gui.back();
                if (self.new_client.debt <= 0) {
                    self.gui.show_popup('error',{
                        'title': _t('Error: No Debt'),
                        'body': _t('The selected customer has no debt.'),
                    });
                    return;
                }
                // if the order is empty, add a dummy product with price = 0
                var order = self.pos.get_order();
                if (order) {
                    var lastorderline = order.get_last_orderline();
                    if (lastorderline == null && self.pos.config.debt_dummy_product_id){
                        var dummy_product = self.pos.db.get_product_by_id(
                            self.pos.config.debt_dummy_product_id[0]);
                        order.add_product(dummy_product, {'price': 0});
                    }
                }

                // select debt journal
                var debtjournal = false;
                _.each(self.pos.cashregisters, function(cashregister) {
                    if (cashregister.journal.debt) {
                        debtjournal = cashregister;
                    }
                });

                // add payment line with amount = debt *-1
                var paymentLines = order.get_paymentlines();
                if (paymentLines.length) {
                    /* Delete existing debt line
                    Usefull for the scenario where a customer comes to
                    pay his debt and the user clicks on the "Debt journal"
                    which opens the partner list and then selects partner
                    and clicks on "Select Customer and Pay Full Debt" */
                    _.each(paymentLines.models, function(paymentLine) {
                        if (paymentLine.cashregister.journal.debt){
                            paymentLine.destroy();
                        }
                    });
                }

                var newDebtPaymentline = new models.Paymentline({},{order: order, cashregister: debtjournal, pos: self.pos});
                newDebtPaymentline.set_amount(self.new_client.debt * -1);
                order.paymentlines.add(newDebtPaymentline);
                self.gui.show_screen('payment');
            });
        }
    });
});
