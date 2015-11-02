openerp.tg_pos_debt_notebook = function(instance){ //module is instance.point_of_sale
    var module = instance.point_of_sale;
    var _t = instance.web._t;

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        initialize: function(session, attributes) {
            var partner_model = _.find(this.models,function(model){ return model.model === 'res.partner'; });
            partner_model.fields.push('debt');
            return PosModelSuper.prototype.initialize.call(this, session, attributes);
        },

        push_order: function(order){
            var self = this;
            var pushed = PosModelSuper.prototype.push_order.call(this, order);
            var client = order && order.get_client();
            if (client){
                order.get('paymentLines').each(function(line){
                    var journal = line.cashregister.journal;
                    if (!journal.debt)
                        return;
                    var amount = line.get_amount();
                    client.debt += amount;
                })
            }
            return pushed;
        },
    });

    module.Order = module.Order.extend({
        addPaymentline: function(cashregister) {
            var self = this;
            var journal = cashregister.journal;
            if (journal.debt && ! this.get_client()){
                setTimeout(function(){
                    var ss = self.pos.pos_widget.screen_selector;
                    ss.set_current_screen('clientlist');
                }, 30);
            }

            var paymentLines = this.get('paymentLines');
            var newPaymentline = new module.Paymentline({},{cashregister:cashregister, pos:this.pos});

            if(journal.type !== 'cash' || journal.debt){
                var val;
                if (journal.debt)
                    val = -this.getChange() || 0
                else
                    val = this.getDueLeft()
                newPaymentline.set_amount( val );
            }
            paymentLines.add(newPaymentline);
            this.selectPaymentline(newPaymentline);
        },

    });

    module.PaymentScreenWidget.include({
        validate_order: function(options) {
            var currentOrder = this.pos.get('selectedOrder');

            var isDebt = false;
            var plines = currentOrder.get('paymentLines').models;
            for (var i = 0; i < plines.length; i++) {
                if (plines[i].cashregister.journal.debt) {
                    isDebt = true;
                    break;
                }
            }

            if (isDebt && !currentOrder.get_client()){
                this.pos_widget.screen_selector.show_popup('error',{
                    'message': _t('Unknown customer'),
                    'comment': _t('You cannot use Debt payment. Select customer first.'),
                });
                return;
            }

            if(isDebt && currentOrder.get('orderLines').models.length === 0){
                this.pos_widget.screen_selector.show_popup('error',{
                    'message': _t('Empty Order'),
                    'comment': _t('There must be at least one product in your order before it can be validated. (Hint: you can use some dummy zero price product)'),
                });
                return;
            }

            this._super(options);
        },

        render_paymentline: function(line){
            el_node = this._super(line);
            var self = this;
            if (line.cashregister.journal.debt){
                el_node.querySelector('.pay-full-debt')
                    .addEventListener('click', function(){self.pay_full_debt(line)});
                }
            return el_node;
        },
        /* Ideas for enhancement :
        - only display the button "Pay Full Debt" when the user has a debt */

        pay_full_debt: function(line){
            partner = this.pos.get_order().get_client();
            // Now I write in the amount the debt x -1
            line.set_amount(partner.debt * -1);
            // refresh the display of the payment line
            this.rerender_paymentline(line);
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
            var currentOrder = this.pos.get('selectedOrder');
            return (
                currentOrder.getPaidTotal() + 0.000001 >=
                currentOrder.getTotalTaxIncluded());
            },
    });

    module.ClientListScreenWidget.include({
        toggle_save_button: function(){
            this._super();
            var $button = this.$('.button.set-customer-pay-full-debt');
            if (this.editing_client) {
                $button.addClass('oe_hidden');
                return;
            } else if (this.new_client){
                if (!this.old_client){
                    $button.text(_t('Set Customer and Pay Full Debt'));
                }else{
                    $button.text(_t('Change Customer and Pay Full Debt'));
                }
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
                self.pos_widget.screen_selector.back();
                if (self.new_client.debt <= 0) {
                    self.pos_widget.screen_selector.show_popup('error',{
                    'message':_t('Error: No Debt'),
                    'comment':_t("The selected customer has no debt."),
                    });
                    return;
                }
                // if the order is empty, add a dummy product with price = 0
                order = self.pos.get_order();
                if (order) {
                    lastorderline = order.getLastOrderline();
                    if (lastorderline == null &&
                            self.pos.config.debt_dummy_product_id){
                        dummy_product = self.pos.db.get_product_by_id(
                            self.pos.config.debt_dummy_product_id[0]);
                        order.addProduct(dummy_product, {'price': 0});
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
                var paymentLines = order.get('paymentLines');
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
                var newDebtPaymentline = new module.Paymentline({},{cashregister:debtjournal, pos:self.pos});
                newDebtPaymentline.set_amount(self.new_client.debt * -1);
                paymentLines.add(newDebtPaymentline);
                self.pos_widget.screen_selector.set_current_screen('payment');
            });
        },
    });
};
