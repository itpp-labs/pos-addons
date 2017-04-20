odoo.define('pos_restaurant.network_printer', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var Session = require('web.Session');
    var gui = require('point_of_sale.gui');
    var Printer = require('pos_restaurant.base');
    var devices = require('point_of_sale.devices');
    var QWeb = core.qweb;
    var mixins = core.mixins;

    models.load_models({
        model: 'restaurant.printer',
        fields: ['network_printer'],
        domain: null,
        loaded: function(self,printers){
            self.printers.forEach(function(item){
                var printer_obj = printers.find(function(printer){
                    return printer.id === item.config.id;
                });
                if (printer_obj.network_printer) {
                    item.config.network_printer = printer_obj.network_printer;
                    self.ready.then(function () {
                        item.connection = new Session(void 0, self.proxy.host, { use_cors: true});
                    });
                }
            });
        },
    });

    Printer.include({
        print: function(receipt){
            var self = this;
            if (this.config.network_printer) {
                var network_proxy = this.config.proxy_ip;
                if(receipt) {
                    this.receipt_queue.push(receipt);
                }
                var send_printing_job = function(){
                    if(self.receipt_queue.length > 0) {
                        var r = self.receipt_queue.shift();
                        self.connection.rpc('/hw_proxy/print_xml_receipt', {
                            receipt: r,
                            proxy: network_proxy
                        }, {timeout: 5000}).then(function () {
                            send_printing_job();
                        }, function () {
                            self.receipt_queue.unshift(r);
                        });
                    }
                };
                send_printing_job();
            } else {
                this._super(receipt);
            }
        },
    });

    devices.ProxyDevice.include({
        message : function(name,params){
            if (name === 'print_xml_receipt' && this.pos.config.receipt_network_printer_ip) {
                var connection = new Session(void 0, this.pos.proxy.host, {
                    use_cors: true
                });
                var callbacks = this.notifications[name] || [];
                for(var i = 0; i < callbacks.length; i++){
                    callbacks[i](params);
                }
                params.proxy = this.pos.config.receipt_network_printer_ip;
                if(this.get('status').status !== 'disconnected'){
                    return connection.rpc('/hw_proxy/' + name, params || {});
                }
                return (new $.Deferred()).reject();
            }
            return this._super(name, params);
        },
    });
});
