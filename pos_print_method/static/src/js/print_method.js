odoo.define('pos_restaurant.print_method', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var Session = require('web.Session');
    var gui = require('point_of_sale.gui');

    var QWeb = core.qweb;
    var mixins = core.mixins;

    models.load_models({
        model: 'restaurant.printer',
        fields: ['printer_method_name'],
        domain: null,
        loaded: function(self,printers){
            self.printers.forEach(function(item){
                var printer_obj = _.find(printers, function(printer){
                    return printer.id == item.config.id;
                });
                item.config.printer_method_name = printer_obj.printer_method_name;
            });
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        printChanges: function(){
            var self = this;
            var printers = this.pos.printers;
            for(var i = 0; i < printers.length; i++){
                var changes = this.computeChanges(printers[i].config.product_categories_ids);
                if ( changes['new'].length > 0 || changes['cancelled'].length > 0){
                    if (printers[i].config.printer_method_name == 'separate_receipt') {
                        var changes_new = $.extend({}, changes);
                        changes_new.new.forEach(function(orderline){
                            changes_new.cancelled = [];
                            changes_new.new = [orderline];
                            self.render_order_receipt(printers[i], changes_new);
                        });
                        var changes_cancelled= $.extend({}, changes);
                        changes_cancelled.cancelled.forEach(function(orderline){
                            changes_cancelled.cancelled = [orderline];
                            changes_cancelled.new = [];
                            self.render_order_receipt(printers[i], changes_cancelled);
                        });
                    } else {
                        self.render_order_receipt(printers[i], changes);
                    }
                }
            }
        },
        render_order_receipt: function(printers, changes) {
            var receipt = QWeb.render('OrderChangeReceipt',{changes:changes, widget:this});
            printers.print(receipt);
        },
    });
});
