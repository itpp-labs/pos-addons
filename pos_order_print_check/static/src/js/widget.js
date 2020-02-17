/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_order_print_check.widget", function(require) {
    "use strict";

    var core = require("web.core");
    var PosBaseWidget = require("point_of_sale.BaseWidget");
    var _t = core._t;

    PosBaseWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);

            if (
                this.gui &&
                this.gui.screen_instances.products &&
                this.gui.screen_instances.products.action_buttons.submit_order
            ) {
                var submit_order_widget = this.gui.screen_instances.products
                    .action_buttons.submit_order;
                submit_order_widget.button_click = function() {
                    var pos_box = self.pos.proxy.get("status");
                    var show_popup = false;
                    if (self.pos.config.use_proxy && pos_box.status !== "connected") {
                        show_popup = true;
                    }

                    if (show_popup) {
                        self.pos.gui.show_popup("error", {
                            title: _t("Error: Cannot print the order"),
                            body: _t("No connection to PosBox."),
                        });
                        return false;
                    }

                    var order = self.pos.get_order();
                    if (order.hasChangesToPrint()) {
                        order.printChanges();
                        order.saveChanges();
                    }
                };
            }
        },
    });
});
