function tg_pos_debt_notebook(instance, module){ //module is instance.point_of_sale
    //var module = instance.point_of_sale;

    var PosModelSuper = module.PosModel
    module.PosModel = module.PosModel.extend({
        load_server_data: function(){
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded =
                loaded.then(function(){
                    return self.fetch('res.partner', ['name','street','city','country_id','phone','zip','mobile','email','ean13', 'debt']);
                }).then(function(partners){
                    self.db.partners_sorted = [];
                    self.partners = partners;
                    self.db.add_partners(partners);

                    return $.when()
                })
            return loaded;
        },
        push_order: function(order){
            var self = this;
            var pushed = PosModelSuper.prototype.push_order.call(this, order);
            var client = order.get_client();
            if (!client)
                return;
            order.get('paymentLines').each(function(line){
                var journal = line.cashregister.journal;
                if (!journal.debt)
                    return;
                var amount = line.get_amount();
                client.debt += amount;
            })
        },
    })

    module.Order = module.Order.extend({
        addPaymentline: function(cashregister) {
            var self = this;
            var journal = cashregister.journal
            if (journal.debt && ! this.get_client()){
                setTimeout(function(){
                    var ss = self.pos.pos_widget.screen_selector;
                    ss.set_current_screen('clientlist');
                }, 30);
                return;
            }

            var paymentLines = this.get('paymentLines');
            var newPaymentline = new module.Paymentline({},{cashregister:cashregister});

            if(journal.type !== 'cash'){
                var val;
                if (journal.debt)
                    val = -this.getChange() || 0
                else
                    val = this.getDueLeft()
                newPaymentline.set_amount( val );
            }
            paymentLines.add(newPaymentline);
            this.selectPaymentline(newPaymentline);
        }

    })
}



(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;
        tg_pos_debt_notebook(instance, module);
    }

    $('<link rel="stylesheet" href="/tg_pos_debt_notebook/static/src/css/tg_pos.css"/>').appendTo($("head"))

})()
