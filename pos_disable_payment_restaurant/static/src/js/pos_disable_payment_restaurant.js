/*  Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
    Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License MIT (https://opensource.org/licenses/MIT). */

odoo.define("pos_disable_payment_restaurant", function(require) {
    "use strict";

    var screens = require("pos_disable_payment");
    var models = require("point_of_sale.models");

    models.load_fields("res.users", [
        "allow_decrease_kitchen",
        "allow_remove_kitchen_order_line",
    ]);

    screens.ProductScreenWidget.include({
        show: function(reset) {
            this._super(reset);
            var self = this;
            var state_mode_buttons = $(".product-screen.screen .numpad .mode-button");
            state_mode_buttons
                .add(".product-screen.screen .order-submit")
                .on("click", function(e) {
                    self.pos.trigger("change:NumpadState");
                });
        },
    });

    screens.OrderWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);
            this.pos.bind("change:NumpadState", function() {
                self.check_numpad_access();
            });
        },

        check_numpad_access: function(line) {
            this._super(line);
            var order = this.pos.get_order();
            if (order) {
                line = line || order.get_selected_orderline();
                this.check_kitchen_access(line);
            }
        },
        orderline_change: function(line) {
            this._super(line);
            var user = this.pos.get_cashier() || this.pos.user;
            if (line && line.quantity <= 0) {
                if (user.allow_delete_order_line) {
                    this.$el.find(".numpad-backspace").removeClass("disable");
                    if (user.allow_remove_kitchen_order_line) {
                        $(".pads .numpad")
                            .find(".numpad-backspace")
                            .removeClass("disable");
                    } else if (line.was_printed) {
                        $(".pads .numpad")
                            .find(".numpad-backspace")
                            .addClass("disable");
                    }
                } else {
                    this.$el.find(".numpad-backspace").addClass("disable");
                }
            }
        },
        orderline_change_line: function(line) {
            this._super(line);
            var order = this.pos.get_order();
            if (order) {
                this.check_kitchen_access(line);
            }
        },
        check_kitchen_access: function(line) {
            var user = this.pos.get_cashier() || this.pos.user;
            var state = this.getParent().numpad.state;
            var common_selector = ".product-screen.screen .numpad .input-button";
            var numpad_buttons = $(common_selector + ".number-char");

            if (user.allow_refund) {
                numpad_buttons = numpad_buttons.add(common_selector + ".numpad-minus");
            }
            if (user.allow_decrease_amount) {
                numpad_buttons = numpad_buttons.add(
                    common_selector + ".numpad-backspace"
                );
            }

            numpad_buttons.removeClass("disable");
            if (
                !user.allow_decrease_kitchen &&
                line &&
                line.was_printed &&
                state.get("mode") === "quantity"
            ) {
                numpad_buttons.addClass("disable");
            }

            if (line && line.quantity <= 0) {
                if (user.allow_delete_order_line) {
                    $(".pads .numpad")
                        .find(".numpad-backspace")
                        .removeClass("disable");
                    if (user.allow_remove_kitchen_order_line) {
                        $(".pads .numpad")
                            .find(".numpad-backspace")
                            .removeClass("disable");
                    } else if (line.was_printed) {
                        $(".pads .numpad")
                            .find(".numpad-backspace")
                            .addClass("disable");
                    }
                } else {
                    $(".pads .numpad")
                        .find(".numpad-backspace")
                        .addClass("disable");
                }
            }
        },
    });

    screens.NumpadWidget.include({
        check_access: function() {
            this._super();
            var user = this.pos.get_cashier() || this.pos.user;
            var order = this.pos.get_order();
            var orderline = order ? order.get_selected_orderline() : false;
            if (orderline && orderline.quantity <= 0) {
                if (user.allow_delete_order_line) {
                    this.$el.find(".numpad-backspace").removeClass("disable");
                    if (user.allow_remove_kitchen_order_line) {
                        this.$el.find(".numpad-backspace").removeClass("disable");
                    } else if (orderline.was_printed) {
                        this.$el.find(".numpad-backspace").addClass("disable");
                    }
                } else {
                    this.$el.find(".numpad-backspace").addClass("disable");
                }
            }
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        set_dirty: function(dirty) {
            if (this.mp_dirty && this.mp_dirty !== dirty && dirty === false) {
                this.was_printed = true;
            }
            _super_orderline.set_dirty.apply(this, arguments);
        },
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            data.was_printed = this.was_printed || false;
            return data;
        },
        init_from_JSON: function(json) {
            this.was_printed = json.was_printed;
            _super_orderline.init_from_JSON.call(this, json);
        },
    });
});
