odoo.define("pos_disable_payment", function(require) {
    "use strict";

    var chrome = require("point_of_sale.chrome");
    var screens = require("point_of_sale.screens");
    var models = require("point_of_sale.models");

    models.load_fields("res.users", [
        "allow_payments",
        "allow_delete_order",
        "allow_discount",
        "allow_edit_price",
        "allow_decrease_amount",
        "allow_delete_order_line",
        "allow_create_order_line",
        "allow_refund",
        "allow_manual_customer_selecting",
    ]);

    // Example of event binding and handling (triggering). Look up binding lower bind('change:cashier' ...
    // Example extending of class (method set_cashier), than was created using extend.
    // /odoo9/addons/point_of_sale/static/src/js/models.js
    // exports.PosModel = Backbone.Model.extend ...
    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        set_cashier: function() {
            PosModelSuper.prototype.set_cashier.apply(this, arguments);
            this.trigger("change:cashier", this);
        },
    });

    chrome.Chrome.include({
        init: function() {
            this._super.apply(this, arguments);
            this.pos.bind("change:selectedOrder", this.check_allow_delete_order, this);
            this.pos.bind("change:cashier", this.check_allow_delete_order, this);
        },
        check_allow_delete_order: function() {
            var user = this.pos.cashier || this.pos.user;
            var order = this.pos.get_order();
            if (order) {
                // User option calls "Allow remove non-empty order". So we got to check if its empty we can delete it.
                if (!user.allow_delete_order && order.orderlines.length > 0) {
                    this.$(".deleteorder-button").addClass("disable");
                } else {
                    this.$(".deleteorder-button").removeClass("disable");
                }
            }
        },
        loading_hide: function() {
            this._super();
            // Extra checks on init
            this.check_allow_delete_order();
        },
    });
    chrome.OrderSelectorWidget.include({
        renderElement: function() {
            this._super();
            this.chrome.check_allow_delete_order();
        },
    });

    screens.OrderWidget.include({
        bind_order_events: function() {
            this._super();
            var self = this;
            var order = this.pos.get("selectedOrder");
            order.orderlines.bind(
                "add remove",
                this.chrome.check_allow_delete_order,
                this.chrome
            );
            this.pos.bind("change:cashier", function() {
                self.check_numpad_access();
            });
        },
        orderline_change: function(line) {
            this._super(line);
            var user = this.pos.cashier || this.pos.user;
            if (line && line.quantity <= 0) {
                if (user.allow_delete_order_line) {
                    $(".numpad-backspace").removeClass("disable");
                } else {
                    $(".numpad-backspace").addClass("disable");
                }
            } else {
                $(".numpad-backspace").removeClass("disable");
            }
            this.check_numpad_access(line);
        },
        click_line: function(orderline, event) {
            this._super(orderline, event);
            this.check_numpad_access(orderline);
        },
        renderElement: function(scrollbottom) {
            this._super(scrollbottom);
            this.check_numpad_access();
        },
        check_numpad_access: function(line) {
            var order = this.pos.get_order();
            if (order) {
                line = line || order.get_selected_orderline();
                var user = this.pos.cashier || this.pos.user;
                var state = this.getParent().numpad.state;
                if (!line) {
                    $(".numpad")
                        .find(".numpad-backspace")
                        .removeClass("disable");
                    $(".numpad")
                        .find("[data-mode='quantity']")
                        .removeClass("disable");
                    return false;
                }

                if (user.allow_decrease_amount) {
                    // Allow all buttons
                    if (
                        $(".numpad")
                            .find("[data-mode='quantity']")
                            .hasClass("disable")
                    ) {
                        $(".numpad")
                            .find("[data-mode='quantity']")
                            .removeClass("disable");
                        state.changeMode("quantity");
                    }
                    if (user.allow_delete_order_line) {
                        $(".numpad")
                            .find(".numpad-backspace")
                            .removeClass("disable");
                    }
                } else {
                    // Disable the backspace button of numpad
                    $(".pads .numpad")
                        .find(".numpad-backspace")
                        .addClass("disable");
                }
            }
        },
        orderline_change_line: function(line) {
            this._super(line);
            var user = this.pos.cashier || this.pos.user;
            var order = this.pos.get_order();
            if (order && !user.allow_decrease_amount) {
                // Disable the backspace button of numpad
                $(".pads .numpad")
                    .find(".numpad-backspace")
                    .addClass("disable");
            }
        },
    });

    // Here regular binding (in init) do not work for some reasons. We got to put binding method in renderElement.
    screens.ProductScreenWidget.include({
        start: function() {
            this._super();
            this.checkPayAllowed();
            this.checkCreateOrderLine();
            this.checkDiscountButton();
        },
        renderElement: function() {
            this._super();
            this.pos.bind("change:cashier", this.checkPayAllowed, this);
            this.pos.bind("change:cashier", this.checkCreateOrderLine, this);
            this.pos.bind("change:cashier", this.checkDiscountButton, this);
        },
        checkCreateOrderLine: function() {
            var user = this.pos.cashier || this.pos.user;
            if (user.allow_create_order_line) {
                $(".numpad").show();
                $(".rightpane").show();
            } else {
                $(".numpad").hide();
                $(".rightpane").hide();
            }
        },
        checkPayAllowed: function() {
            var user = this.pos.cashier || this.pos.user;
            if (user.allow_payments) {
                this.actionpad.$(".pay").removeClass("disable");
            } else {
                this.actionpad.$(".pay").addClass("disable");
            }
        },
        checkDiscountButton: function() {
            var user = this.pos.cashier || this.pos.user;
            if (user.allow_discount) {
                $(".control-button.js_discount").removeClass("disable");
            } else {
                $(".control-button.js_discount").addClass("disable");
            }
        },
        show: function(reset) {
            this._super(reset);
            if (reset) {
                this.order_widget.check_numpad_access();
            }
        },
    });
    screens.ScreenWidget.include({
        renderElement: function() {
            this._super();
            var user = this.pos.cashier || this.pos.user;
            if (user.allow_payments) {
                $(".pay").removeClass("disable");
            } else {
                $(".pay").addClass("disable");
            }
            if (user.allow_create_order_line) {
                $(".numpad").show();
                $(".rightpane").show();
            } else {
                $(".numpad").hide();
                $(".rightpane").hide();
            }
        },
    });
    screens.ActionpadWidget.include({
        init: function(parent, options) {
            this._super(parent, options);
            this.pos.bind("change:cashier", this.checkManualCustomerSelecting, this);
        },
        checkManualCustomerSelecting: function() {
            var user = this.pos.cashier || this.pos.user;
            if (user.allow_manual_customer_selecting) {
                this.$(".set-customer").removeClass("disable");
            } else {
                this.$(".set-customer").addClass("disable");
            }
        },
        renderElement: function() {
            this._super();
            var user = this.pos.cashier || this.pos.user;
            if (user.allow_payments) {
                $(".pay").removeClass("disable");
            } else {
                $(".pay").addClass("disable");
            }
            this.checkManualCustomerSelecting();
        },
    });
    screens.PaymentScreenWidget.include({
        init: function(parent, options) {
            this._super(parent, options);
            this.pos.bind("change:cashier", this.checkManualCustomerSelecting, this);
        },
        checkManualCustomerSelecting: function() {
            var user = this.pos.cashier || this.pos.user;
            if (user.allow_manual_customer_selecting) {
                this.$(".js_set_customer").removeClass("disable");
            } else {
                this.$(".js_set_customer").addClass("disable");
            }
        },
        renderElement: function() {
            this._super();
            this.checkManualCustomerSelecting();
        },
    });
    screens.NumpadWidget.include({
        init: function() {
            this._super.apply(this, arguments);
            this.pos.bind("change:cashier", this.check_access, this);
        },
        renderElement: function() {
            this._super();
            this.check_access();
        },
        check_access: function() {
            var user = this.pos.cashier || this.pos.user;
            var order = this.pos.get_order();
            var orderline = false;
            if (order) {
                orderline = order.get_selected_orderline();
            }
            if (user.allow_discount) {
                this.$el.find("[data-mode='discount']").removeClass("disable");
            } else {
                this.$el.find("[data-mode='discount']").addClass("disable");
            }
            if (user.allow_edit_price) {
                this.$el.find("[data-mode='price']").removeClass("disable");
            } else {
                this.$el.find("[data-mode='price']").addClass("disable");
            }
            if (user.allow_refund) {
                this.$el.find(".numpad-minus").removeClass("disable");
            } else {
                this.$el.find(".numpad-minus").addClass("disable");
            }
            if (orderline && orderline.quantity <= 0) {
                if (user.allow_delete_order_line) {
                    this.$el.find(".numpad-backspace").removeClass("disable");
                } else {
                    this.$el.find(".numpad-backspace").addClass("disable");
                }
            }
        },
    });

    return screens;
});
