openerp.tg_pos_debt_notebook = function(instance){ //module is instance.point_of_sale
    var module = instance.point_of_sale;
    var _t = instance.web._t;

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        load_server_data: function(){
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded =
                loaded.then(function(){
                    return self.fetch('res.partner', ['debt']);
                }).then(function(partners){
                    $.each(partners, function(){
                        $.extend(self.db.get_partner_by_id(this.id) || {}, this)
                    });
                return $.when();
                })
            return loaded;
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
    });
};
