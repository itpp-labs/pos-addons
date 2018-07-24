odoo.define('pos_payment_wechat', function(require){
    "use strict";

    var rpc = require('web.rpc');
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var session = require('web.session');

    var _t = core._t;

    models.load_fields('account.journal', ['wechat']);

    gui.Gui.prototype.screen_classes.filter(function(el) { return el.name == 'payment'})[0].widget.include({
        init: function(parent, options) {
            this._super(parent, options);
            this.pos.bind('validate_order',function(){
                 this.validate_order();
            },this);
        }
    });



    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.wechat = new Wechat(this);

            this.bus.add_channel_callback(
                "wechat",
                this.on_wechat,
                this);
            this.ready.then(function(){
                // take out wechat micropay cashregister from cashregisters to avoid
                // rendering in payment screent
                var micropay_journal = _.filter(self.journals, function(r){
                    return r.wechat == 'micropay';
                });
                if (micropay_journal.length){
                    if (micropay_journal.length > 1){
                        // TODO warning
                        console.log('error', 'More than one wechat journals found');
                    }
                    self.micropay_journal = micropay_journal[0];
                } else {
                    return;
                }
                self.all_cashregisters = self.cashregisters;
                self.cashregisters = _.filter(self.cashregisters, function(r){
                    return r.journal_id[0] != self.micropay_journal.id;
                });
            });

        },
        scan_product: function(parsed_code){
            // TODO: do we need to make this optional?
            var value = parsed_code.code;
            if (this.wechat.check_auth_code(value)){
                this.wechat.process_qr(value);
                return true;
            }
            return PosModelSuper.prototype.scan_product.apply(this, arguments);
        },
        on_wechat: function(msg){
            var order = this.get('orders').find(function(item){
                return item.uid === msg.order_ref;
            });
            if (order){
                var creg = _.filter(this.all_cashregisters, function(r){
                    return r.journal_id[0] == msg['journal_id'];
                })[0];

                // add payment
                var newPaymentline = new models.Paymentline({},{
                    order: order,
                    micropay_id: msg['micropay_id'],
                    journal_id: msg['journal_id'],
                    cashregister: creg,
                    pos: this});
                newPaymentline.set_amount( msg['total_fee'] / 100.0 );
                order.paymentlines.add(newPaymentline);

                if (order.is_paid() == 0){
                    /* order is paid and has to be closed */
                    this.trigger('validate_order');
                }
            } else {
                console.log('error', 'Order is not found');
            }
        },
        // TODO: move to a separate model?
        wechat_qr_payment: function(order, creg){
            /* send request asynchronously */
            var self = this;

            var pos = this;
            var terminal_ref = 'POS/' + pos.config.name;
            var pos_id = pos.config.id;

            var lines = order.orderlines.map(function(r){
                return {
                    quantity: 1, // always use 1 because quantity is taken into account in price field
                    quantity_full: r.get_quantity(),
                    price: r.get_price_with_tax(),
                    product_id: r.get_product().id,
                }
            });

            // Send without repeating on failure
            return rpc.query({
                model: 'wechat.order',
                method: 'create_qr',
                kwargs: {
                    'lines': lines,
                    'order_ref': order.uid,
                    'pay_amount': order.get_due(),
                    'terminal_ref': terminal_ref,
                    'pos_id': pos_id,
                    'journal_id': creg.journal.id,
                },
            }).then(function(data){
                if (data.code_url){
                    order.payment_qr = data.code_url;
                    self.show_payment_qr(data.code_url);
                    if (self.config.iface_customer_facing_display) {
                        self.send_current_order_to_customer_facing_display();
                    }
                } else if (data.error) {
                    self.show_warning(data.error);
                } else {
                    self.show_warning('Unknown error');
                }
            });
        },
        show_payment_qr: function(code_url){
            /* ecLevel -- Error Correction Level
                L - Low (7%)
                M - Medium (15%)
                Q - Quartile (25%)
                H - High (30%)

                For more options see https://larsjung.de/jquery-qrcode/
            */
            this.hide_payment_qr();
            $('.qr-container').qrcode({
                'text': code_url,
                'ecLevel': 'H',
                'size': 400,
            });
        },
        hide_payment_qr: function(){
            $('.qr-container').empty();
        },
        show_warning: function(warning_message){
            console.info('error', warning_message);
            this.chrome.gui.show_popup('error',{
                'title': _t('Warning'),
                'body': warning_message,
            });
        },
        render_html_for_customer_facing_display: function () {
            var self = this;
            var res = PosModelSuper.prototype.render_html_for_customer_facing_display.apply(this, arguments);
            var order = this.get_order();
            if (!order.payment_qr){
                return res;
            }
            return res.then(function(rendered_html){
                var $rendered_html = $(rendered_html);

                var $elem = $rendered_html.find('.pos-adv');
                $elem.qrcode({
                    'render': 'image',
                    'text': order.payment_qr,
                    'ecLevel': 'H',
                    'size': 400,
                });
                var image64 = $elem.find('img').attr('src');
                $elem.find('img').remove();
                $elem.css('background-image', 'url(' + image64 + ')');
                $rendered_html.find('.pos-payment_info').css('background-color', '#888');

                // prop only uses the first element in a set of elements,
                // and there's no guarantee that
                // customer_facing_display_html is wrapped in a single
                // root element.
                rendered_html = _.reduce($rendered_html, function (memory, current_element) {
                    return memory + $(current_element).prop('outerHTML');
                }, ""); // initial memory of ""

                return rendered_html;
            })
        },
    });


    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        add_paymentline: function(cashregister){
            if (cashregister.journal.wechat == 'native'){
                this.pos.wechat_qr_payment(this, cashregister);
                return;
            }
            return OrderSuper.prototype.add_paymentline.apply(this, arguments);
        },
    });

    var PaymentlineSuper = models.Paymentline;
    models.Paymentline = models.Paymentline.extend({
        initialize: function(attributes, options){
            PaymentlineSuper.prototype.initialize.apply(this, arguments);
            this.micropay_id = options.micropay_id;
        },
        // TODO: do we need to extend init_from_JSON too ?
        export_as_JSON: function(){
            var res = PaymentlineSuper.prototype.export_as_JSON.apply(this, arguments);
            res['micropay_id'] = this.micropay_id;
            return res;
        },
    });

    var Wechat = Backbone.Model.extend({
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
            // TODO: do we need to integrate this with barcode.nomenclature?
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
            // TODO: block order for editing
            this.micropay(auth_code, order);
        },
        micropay: function(auth_code, order){
            /* send request asynchronously */
            var self = this;

            var terminal_ref = 'POS/' + self.pos.config.name;
            var pos_id = self.pos.config.id;

            var send_it = function () {
                return rpc.query({
                    model: 'wechat.micropay',
                    method: 'pos_create_from_qr',
                    kwargs: {
                        'auth_code': auth_code,
                        'pay_amount': order.get_due(),
                        'order_ref': order.uid,
                        'terminal_ref': terminal_ref,
                        'journal_id': self.pos.micropay_journal.id,
                        'pos_id': pos_id,
                    },
                })
            };

            var current_send_number = 0;
            return send_it().fail(function (error, e) {
                if (self.pos.debug){
                    console.log('Wechat', self.pos.config.name, 'failed request #'+current_send_number+':', error.message);
                }
                self.pos.show_warning();
            });
        },
    });
});
