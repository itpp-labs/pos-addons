odoo.define("pos_restaurant.print_method", function(require) {
    "use strict";

    var models = require("pos_restaurant_base.models");
    var core = require("web.core");
    var QWeb = core.qweb;

    models.load_models({
        model: "restaurant.printer",
        fields: ["printer_method_name"],
        domain: null,
        loaded: function(self, printers) {
            self.printers.forEach(function(item) {
                var printer_obj = _.find(printers, function(printer) {
                    return printer.id === item.config.id;
                });
                item.config.printer_method_name = printer_obj.printer_method_name;
            });
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        print_order_receipt: function(printer, changes) {
            var self = this;
            function delay(ms) {
                var d = $.Deferred();
                setTimeout(function() {
                    d.resolve();
                }, ms);
                return d.promise();
            }

            // This check is required for compatibility with the module https://www.odoo.com/apps/modules/10.0/pos_order_receipt_custom/
            if (changes.changes_table && self.print_custom_receipt) {
                self.print_custom_receipt(printer, changes);
            }

            if (changes.new.length > 0 || changes.cancelled.length > 0) {
                if (printer.config.printer_method_name === "separate_receipt") {
                    var q = $.when();

                    var changes_new = $.extend({}, changes);
                    changes_new.new.forEach(function(orderline) {
                        q = q.then(function() {
                            changes_new.cancelled = [];
                            changes_new.new = [orderline];

                            // This check is required for compatibility with the module https://www.odoo.com/apps/modules/10.0/pos_order_receipt_custom/
                            if (
                                printer.config.custom_order_receipt &&
                                self.print_custom_receipt
                            ) {
                                self.print_custom_receipt(printer, changes_new);
                            } else {
                                var receipt = QWeb.render("OrderChangeReceipt", {
                                    changes: changes_new,
                                    widget: self,
                                });
                                printer.print(receipt);
                            }
                            return delay(100);
                        });
                    });

                    var changes_cancelled = $.extend({}, changes);
                    changes_cancelled.cancelled.forEach(function(orderline) {
                        q = q.then(function() {
                            changes_cancelled.cancelled = [orderline];
                            changes_cancelled.new = [];
                            // This check is required for compatibility with the module https://www.odoo.com/apps/modules/10.0/pos_order_receipt_custom/
                            if (
                                printer.config.custom_order_receipt &&
                                self.print_custom_receipt
                            ) {
                                self.print_custom_receipt(printer, changes_cancelled);
                            } else {
                                var receipt = QWeb.render("OrderChangeReceipt", {
                                    changes: changes_cancelled,
                                    widget: self,
                                });
                                printer.print(receipt);
                            }
                            return delay(100);
                        });
                    });
                } else {
                    OrderSuper.prototype.print_order_receipt.apply(this, arguments);
                }
            }
        },
    });
});
