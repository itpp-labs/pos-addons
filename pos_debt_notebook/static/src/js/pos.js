odoo.define('pos_debt_notebook.pos', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var utils = require('web.utils');

    var _t = core._t;
    var round_pr = utils.round_precision;

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            var partner_model = _.find(this.models, function(model){ return model.model === 'res.partner'; });
            partner_model.fields.push('debt_type', 'debt', 'debt_limit');
            var journal_model = _.find(this.models, function(model){ return model.model === 'account.journal'; });
            journal_model.fields.push('debt');
            var product_model = _.find(this.models, function(model){ return model.model === 'product.product'; });
            product_model.fields.push('credit_product');
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
                });
            }
            return pushed;
        }
    });

    models.Order = models.Order.extend({
        has_credit_product: function(){
            return this.orderlines.any(function(line){
                return line.product.credit_product;
            });
        },
        add_paymentline: function(cashregister) {
            this.assert_editable();
            var self = this;
            var journal = cashregister.journal;
            if (!this.get_client() && (this.has_credit_product() || journal.debt)){
                setTimeout(function(){
                    self.pos.gui.show_screen('clientlist');
                }, 30);
            }

            var newPaymentline = new models.Paymentline({},{order: this, cashregister: cashregister, pos: this.pos});
            if (cashregister.journal.debt){
                newPaymentline.set_amount(this.get_due_debt());
            } else if (cashregister.journal.type !== 'cash' || this.pos.config.iface_precompute_cash){
                newPaymentline.set_amount(this.get_due());
            }
            this.paymentlines.add(newPaymentline);
            this.select_paymentline(newPaymentline);
        },
        get_due_debt: function(paymentline) {
            var due = this.get_total_with_tax() - this.get_total_paid();
            if (paymentline) {
                due = this.get_total_with_tax();
                var lines = this.paymentlines.models;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] === paymentline) {
                        break;
                    } else {
                        due -= lines[i].get_amount();
                    }
                }
            }
            return round_pr(due, this.pos.currency.rounding);
        }
    });

    screens.PaymentScreenWidget.include({
        validate_order: function(options) {
            var currentOrder = this.pos.get_order();
            var isDebt = false;
            var plines = currentOrder.get_paymentlines();
            var debt_amount = 0;
            for (var i = 0; i < plines.length; i++) {
                if (plines[i].cashregister.journal.debt) {
                    isDebt = true;
                    debt_amount += plines[i].amount;
                }
            }
            var client = currentOrder.get_client();
            if (isDebt && !client){
                this.gui.show_popup('error',{
                    'title': _t('Unknown customer'),
                    'body': _t('You cannot use Debt payment. Select customer first.'),
                });
                return;
            }
            if (currentOrder.has_credit_product() && !client){
                this.gui.show_popup('error',{
                    'title': _t('Unknown customer'),
                    'body': _t("Don't forget to specify Customer when sell Credits."),
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
            if (client && debt_amount > 0 && client.debt + debt_amount > client.debt_limit) {
                this.gui.show_popup('error', {
                    'title': _t('Max Debt exceeded'),
                    'body': _t('You cannot sell products on credit to the customer, because his max debt value will be exceeded.')
                });
                return;
            }
            client && this.pos.gui.screen_instances.clientlist.partner_cache.clear_node(client.id);
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
            if (client) {
                debt = Math.round(client.debt * 100) / 100;
                if (client.debt_type == 'credit') {
                    debt = - debt;
                }
            }
            var $js_customer_name = this.$('.js_customer_name');
            var $pay_full_debt = this.$('.pay-full-debt');
            $js_customer_name.text(client ? client.name : _t('Customer'));
            $pay_full_debt.on('click', function() {self.pay_full_debt();});
            $pay_full_debt.addClass('oe_hidden');
            if (client && debt) {
                if (client.debt_type == 'debt') {
                    if (debt > 0) {
                        $pay_full_debt.removeClass('oe_hidden');
                        $js_customer_name.append('<span class="client-debt positive"> [Debt: ' + debt + ']</span>');
                    } else if (debt < 0) {
                        $js_customer_name.append('<span class="client-debt negative"> [Debt: ' + debt + ']</span>');
                    }
                } else if (client.debt_type == 'credit') {
                    if (debt > 0) {
                        $js_customer_name.append('<span class="client-credit positive"> [Credit: ' + debt + ']</span>');
                    } else if (debt < 0) {
                        $pay_full_debt.removeClass('oe_hidden');
                        $js_customer_name.append('<span class="client-credit negative"> [Credit: ' + debt + ']</span>');
                    }
                }
            }
        }
    });

    gui.Gui.prototype.screen_classes.filter(function(el) { return el.name == 'clientlist';})[0].widget.include({
        init: function(parent, options){
            this._super(parent, options);
            this.round = function(value) {
                return Math.round(value * 100) / 100;
            };
            this.check_user_in_group = function(group_id, groups) {
                return  $.inArray(group_id, groups) != -1;
            };
        },
        render_list: function(partners){
            var debt_type = partners && partners.length ? partners[0].debt_type : '';
            if (debt_type == 'debt') {
                this.$('#client-list-credit').remove();
            } else if (debt_type == 'credit') {
                this.$('#client-list-debt').remove();
            }
            this._super(partners);
        },
        toggle_save_button: function(){
            this._super();
            var $pay_full_debt = this.$('#set-customer-pay-full-debt');
            var curr_client = this.pos.get_order().get_client();
            if (this.editing_client) {
                $pay_full_debt.addClass('oe_hidden');
            } else {
                if ((this.new_client && this.new_client.debt > 0) ||
                        (curr_client && curr_client.debt > 0 && !this.new_client)) {
                    $pay_full_debt.removeClass('oe_hidden');
                }else{
                    $pay_full_debt.addClass('oe_hidden');
                }
            }
        },

        show: function(){
            this._super();
            var self = this;
            this.$('#set-customer-pay-full-debt').click(function(){
                self.save_changes();
//                self.gui.back();
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
        },
        saved_client_details: function(partner_id){
            this.pos.gui.screen_instances.clientlist.partner_cache.clear_node(partner_id);
            this._super(partner_id);
        },
        reload_partners: function(){
            var self = this;
            return this._super().then(function () {
                self.render_list(self.pos.db.get_partners_sorted(1000));
            });
        }
    });
});
