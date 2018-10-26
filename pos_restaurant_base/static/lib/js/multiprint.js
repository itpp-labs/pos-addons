odoo.define('pos_restaurant.base', function (require) {
    "use strict";
    // DIFFERENCES FROM ORIGINAL: 
    // * Printer class is copy-pasted, but added to returns to be extendable
    // * PosModel::initialize is updated to use this Printer class

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var Session = require('web.Session');

    var mixins = require("web.mixins");

    var Printer = core.Class.extend(mixins.PropertiesMixin,{
        init: function(parent,options){
            mixins.PropertiesMixin.init.call(this,parent);
            options = options || {};
            var url = options.url || 'http://localhost:8069';
            this.connection = new Session(undefined,url, { use_cors: true});
            this.host       = url;
            this.receipt_queue = [];
        },
        print: function(receipt){
            var self = this;
            if(receipt){
                this.receipt_queue.push(receipt);
            }
            function send_printing_job(){
                if(self.receipt_queue.length > 0){
                    var r = self.receipt_queue.shift();
                    self.connection.rpc('/hw_proxy/print_xml_receipt',{receipt: r},{timeout: 5000})
                        .then(function(){
                            send_printing_job();
                        },function(){
                            self.receipt_queue.unshift(r);
                        });
                }
            }
            send_printing_job();
        },
    });

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            // <new-code>
            var printer_model = _.find(this.models, function(model){
                return model.model === 'restaurant.printer';
            });
            printer_model.loaded = function(self,printers) {
                var active_printers = {};
                for (var i = 0; i < self.config.printer_ids.length; i++) {
                    active_printers[self.config.printer_ids[i]] = true;
                }

                self.printers = [];
                self.printers_categories = {}; // list of product categories that belong to one or more order printer
                for(var i = 0; i < printers.length; i++){
                    if(active_printers[printers[i].id]){
                        var url = printers[i].proxy_ip;
                        if(url.indexOf('//') < 0){
                            url = 'http://'+url;
                        }
                        if(url.indexOf(':',url.indexOf('//')+2) < 0){
                            url = url+':8069';
                        }
                        var printer = new Printer(self,{url:url});
                        printer.config = printers[i];
                        self.printers.push(printer);

                        for (var j = 0; j < printer.config.product_categories_ids.length; j++) {
                            self.printers_categories[printer.config.product_categories_ids[j]] = true;
                        }
                    }
                }
                self.printers_categories = _.keys(self.printers_categories);
                self.config.iface_printers = !!self.printers.length;
            }
            // </new-code>
            return _super_posmodel.initialize.call(this, session, attributes);
        },
    });
    return Printer;
});
