odoo.define('pos_payment_wechat', function(require){

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');


    models.load_models({
        model: 'account.journal',
        fields: ['id','name','wechat_payment'],
//        domain: function(self){
//            return [['pos_config_id','=',self.config.id]]; // TODO how to determine journals of selected pos ?
//        },
        loaded: function(self,journals){
            _.each(self.cashregisters, function(cr){
                _.each(journals, function(jr){
                    if ( cr.journal.id === jr.id )
                        cr.journal.wechat_payment = jr.wechat_payment;
                });
            });
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
    check_auth_code: function() {
        var code = this.auth_code;
        if (code && Number.isInteger(+code) &&
            code.length === 18 &&
            +code[0] === 1 && (+code[1] >= 0 && +code[1] <= 5)) {
            return true;
        }
        return false;
    },
    });

    screens.PaymentScreenWidget.include({
        click_paymentmethods: function(id) {
            var cashregister = this.get_journal(id);
            if (cashregister.journal.wechat_payment && !this.pos.get_order().check_auth_code()) {
                this.gui.show_popup('qr_scan');
            } else {
                this._super(id);
            }
        },
        get_journal: function(id) {
            var cashregister = null;
            for ( var i = 0; i < this.pos.cashregisters.length; i++ ) {
                if ( this.pos.cashregisters[i].journal_id[0] === id ){
                    cashregister = this.pos.cashregisters[i];
                    break;
                }
            }
            return cashregister
        },
    })


});
