odoo.define("pos_order_print_check.models", function(require) {
    "use strict";

    var models = require("pos_restaurant_base.models");
    var core = require("web.core");
    var _t = core._t;

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        print_order_receipt: function(printer, changes) {
            this.old_res = this.saved_resume || {};
            var self = this;
            if (changes.new.length > 0 || changes.cancelled.length > 0) {
                printer.check_connection().then(
                    function() {
                        _super_order.print_order_receipt.call(self, printer, changes);
                        var cancelled_lines = changes.cancelled || [];
                        var new_lines = changes.new || [];
                        var lines = new_lines.concat(cancelled_lines);
                        lines.forEach(function(l) {
                            var line = self.get_orderline(l.line_id);
                            if (line) {
                                if (line.mp_skip) {
                                    return;
                                }
                                var line_hash = line.get_line_diff_hash();
                                var line_resume = self.get_line_resume(line);
                                if (typeof self.old_res[line_hash] === "undefined") {
                                    self.old_res[line_hash] = line_resume;
                                } else {
                                    self.old_res[line_hash].qty += line_resume.qty;
                                }
                            } else {
                                delete self.old_res[l.line_id];
                            }
                        });
                        self.saved_resume = self.old_res;
                        self.trigger("change", self);
                    },
                    function() {
                        self.pos.gui.show_popup("error", {
                            title: _t("Error: Cannot print some of the products"),
                            body: _t(
                                "No connection to the printer: " + printer.config.name
                            ),
                        });
                        setTimeout(function() {
                            self.saved_resume = self.old_res;
                            var cancelled_lines = changes.cancelled || [];
                            var new_lines = changes.new || [];
                            var lines = new_lines.concat(cancelled_lines);
                            lines.forEach(function(l) {
                                var line = self.get_orderline(l.line_id);
                                if (line) {
                                    line.set_dirty(true);
                                }
                            });
                            self.trigger("change", self);
                        }, 0);
                    }
                );
            }
        },
    });

    return models;
});
