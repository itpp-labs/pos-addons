odoo.define('pos_payment_wechat', function(require){

    var rpc = require('web.rpc');
    var core = require('web.core');
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
            this.wechat = new exports.Wechat(this);

            self.bus.add_channel_callback(
                "micropay",
                self.on_micropay,
                self);

        },
        on_micropay: function(msg){
            // CONTINUE
        },
    });

    exports.Wechat = Backbone.Model.extend({
        initialize: function(pos){
            var self = this;
            this.pos = pos;
            core.bus.on('qr_scanned', this, function(value){
                if (self.check_auth_code(value)){
                    self.process_qr(value);
                }
            });
        },
        check_auth_code: function(code) {
            if (code && Number.isInteger(+code) &&
                code.length === 18 &&
                +code[0] === 1 && (+code[1] >= 0 && +code[1] <= 5)) {
                return true;
            }
            return false;
        },
        process_qr: function(auth_code){
            var order = this.pos.get_order();
            if (!order){
                return;
            }
            self.micropay(auth_code, order);
        },
        micropay: function(auth_code, order){
            // send request asynchronously

            var total_fee = order.get_total_with_tax();

            var send_it = function () {
                return rpc.query({
                    model: 'wechat.micropay',
                    method: 'pos_create_from_qr',
                    kwargs: {
                        'auth_code': auth_code,
                        'total_fee': total_fee,
                    },
                })
            };

            var current_send_number = 0;
            return send_it().fail(function (error, e) {
                if (self.pos.debug){
                    console.log('MS', self.pos.config.name, 'failed request #'+current_send_number+':', error.message);
                }
                this.show_warning();
            }).always(function(res){
                console.log(res);
                if (self.pos.debug){
                    console.log('MS', self.pos.config.name, 'response #'+current_send_number+':', JSON.stringify(res));
                }
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
