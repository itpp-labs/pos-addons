odoo.define('pos_payment_wechat', function(require){

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var session = require('web.session');


    var exports = {};
    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.wechat = new exports.WechatPayment(this);
        },
    });

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
    });

    exports.WechatPayment = Backbone.Model.extend({
        initialize: function(pos){
            var self = this;
            this.pos = pos;
        },
        send_test: function(){
            var data = {};
            var pos = this.pos;
            data.pos_id = pos.config.id;
            data.cashier_id = pos.config.id;
            data.order_id = pos.config.id;
            data.session_id = pos.pos_session.id;
            return this.send({data: data}, "/wechat/test");
        },
        send_get_key: function(au_c){
            var data = {};
            return this.send({data: data}, "/wechat/getsignkey")
        },
        send_payment: function(au_c){
            var data = {};
            var pos = this.pos;
            data.pos_id = pos.config.id;
            data.cashier_id = pos.config.id;
            data.order_id = pos.config.id;
            data.session_id = pos.pos_session.id;
            data.order_short = [];
            _.each(this.pos.get_order().get_orderlines(), function(line){
                return data.order_short.push(line.product.display_name);
            })
            data.total_fee = Math.round(pos.get_order().get_total_with_tax());
            data.auth_code = pos.get_order().auth_code || au_c;
            return this.send({data: data}, "/wechat/payment_commence")
//            .always(function(res){
//                console.log(res);
//            });
        },
        send: function(message, address){
            var current_send_number = 0;
            if (this.pos.debug){
                current_send_number = this._debug_send_number++;
                console.log('MS', this.pos.config.name, 'send #' + current_send_number +' :', JSON.stringify(message));
            }
            var self = this;
            var send_it = function () {
                return session.rpc(address, {
                    message: message,
                });
            };
            return send_it().fail(function (error, e) {
                if (self.pos.debug){
                    console.log('MS', self.pos.config.name, 'failed request #'+current_send_number+':', error.message);
                }
                this.show_warning();
            }).always(function(res){
                console.log(res);
                if (self.pos.debug){
                    console.log('MS', self.pos.config.name, 'response #'+current_send_number+':', JSON.stringify(res));
                console.lo
                }
                console.log('test')
            });
        },
        warning: function(warning_message){
            console.info('warning', warning_message);
            this.pos.chrome.gui.show_popup('error',{
                'title': _t('Warning'),
                'body': warning_message,
            });
        },
        show_warning: function(){
            var warning_message = _t("Some problems have happened. TEST");
            this.warning(warning_message);
        }
    });
    return exports;
});
