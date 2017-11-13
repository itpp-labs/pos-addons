odoo.define('pos_wechat', function(require){

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');


    models.load_models({
        model: 'account.journal',
        fields: ['id','name','wechat_payment','smth_new_from_qr'],
//        domain: function(self){
//            return [['pos_config_id','=',self.config.id]]; // TODO how to determine journals of selected pos ?
//        },
        loaded: function(self,journals){
            _.each(self.cashregisters, function(cr){
                _.each(journals, function(jr){
                    if ( cr.journal.id === jr.id )
                        cr.journal.wechat_payment = jr.wechat_payment;
                        cr.journal.smth_new_from_qr = jr.smth_new_from_qr || false;
                });
            });
        },
    });

    screens.PaymentScreenWidget.include({
        click_paymentmethods: function(id) {
            var cashregister = this.get_journal(id);
            if (cashregister.journal.smth_new_from_qr) {
                this._super(id);
            } else {
                this.gui.show_popup('qr_scan');
                if (this.pos.smth_new) {
                    this._super(id);
                } else {
                    return;
                }
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
