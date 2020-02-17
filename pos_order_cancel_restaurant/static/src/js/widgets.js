/* Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_order_cancel_restaurant.widgets", function(require) {
    "use strict";

    var screens = require("point_of_sale.screens");
    var chrome = require("point_of_sale.chrome");
    var core = require("web.core");
    var PosOrderCancelWidget = require("pos_order_cancel.widgets");

    var _t = core._t;

    chrome.OrderSelectorWidget.include({
        deleteorder_click_handler: function(event, $el) {
            var order = this.pos.get_order();
            if (!order) {
                return;
            }
            if (this.pos.config.kitchen_canceled_only) {
                if (
                    order.is_empty() &&
                    order.canceled_lines &&
                    order.canceled_lines.length
                ) {
                    order.destroy_and_upload_as_canceled();
                } else if (
                    !order.is_empty() &&
                    !order.get_order_lines_by_dirty_status(false).length
                ) {
                    this.gui.show_popup("confirm", {
                        title: _t("Destroy Current Order ?"),
                        body: _t(
                            "You will lose any data associated with the current order"
                        ),
                        confirm: function() {
                            order.destroy_and_upload_as_canceled();
                        },
                    });
                } else {
                    this._super(event, $el);
                }
            } else {
                this._super(event, $el);
            }
        },
    });

    screens.OrderWidget.include({
        show_popup: function(type) {
            var order = this.pos.get_order();
            var orderline = order.get_selected_orderline();
            var config = this.pos.config;
            if (
                config.kitchen_canceled_only &&
                orderline &&
                !orderline.was_printed &&
                type === "product"
            ) {
                return false;
            }
            if (
                config.ask_managers_pin &&
                config.ask_managers_pin_kitchen_orders_only &&
                orderline &&
                (type !== "product" || !orderline.was_printed)
            ) {
                return this.show_confirm_cancellation_popup(type, orderline);
            }
            return this._super(type);
        },
    });

    PosOrderCancelWidget.ReasonCancellationScreenWidget.include({
        save_changes: function() {
            this._super();
            var type = this.get_type();
            if (this.pos.config.auto_send_to_kitchen && type === "product") {
                this.auto_sent_to_kitchen();
            }
        },
        auto_sent_to_kitchen: function() {
            var order = this.pos.get_order();
            if (order) {
                var current_line = order.get_selected_orderline();
                if (current_line.was_printed && order.hasChangesToPrint()) {
                    order.printChanges();
                    order.saveChanges();
                }
            }
        },
    });

    PosOrderCancelWidget.ConfirmCancellationPopupWidget.include({
        click_confirm: function() {
            this._super();
            if (this.pos.config.auto_send_to_kitchen && this.type === "product") {
                this.auto_sent_to_kitchen();
            }
        },
        auto_sent_to_kitchen: function() {
            var order = this.pos.get_order();
            if (order) {
                var current_line = order.get_selected_orderline();
                if (current_line.was_printed && order.hasChangesToPrint()) {
                    order.printChanges();
                    order.saveChanges();
                }
            }
        },
    });
});
