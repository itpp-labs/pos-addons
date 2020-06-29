/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
   License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_wechat_miniprogram.screens", function(require) {
    "use strict";

    var screens = require("point_of_sale.screens");
    var core = require("web.core");
    var _t = core._t;

    screens.ProductScreenWidget.include({
        show: function(reset) {
            this._super();
            var self = this;
            if (reset) {
                var order = this.pos.get_order();
                if (
                    order &&
                    order.miniprogram_order &&
                    order.miniprogram_order.state === "done"
                ) {
                    $(this.el).addClass("paid");
                    $(this.el)
                        .find(".rightpane .layout-table")
                        .before('<div class="disable-products"></div>');
                    var validate =
                        "<button class='button validate'><div class='pay-circle'><i class='fa fa-check' /></div>Validate</button>";
                    $(this.el)
                        .find(".actionpad")
                        .append(validate);
                } else {
                    $(this.el).removeClass("paid");
                    $(this.el)
                        .find(".rightpane .disable-products")
                        .remove();
                    $(this.el)
                        .find(".actionpad .validate")
                        .remove();
                }
                this.$(".validate").click(function() {
                    self.actionpad.click_validate_paid_order();
                });
            }
        },
    });

    screens.PaymentScreenWidget.include({
        render_paymentmethods: function() {
            var methods = this._super();
            var jsapi_journal = this.pos.get_mp_cashregister();
            if (jsapi_journal) {
                var el = methods.find("[data-id=" + jsapi_journal.journal_id[0] + "]");
                if (el.length) {
                    el.remove();
                }
            }
            return methods;
        },
    });

    screens.ClientListScreenWidget.include({
        show: function() {
            this._super();
            var order = this.pos.get_order();
            if (
                order &&
                order.miniprogram_order &&
                order.miniprogram_order.state === "done"
            ) {
                $(this.el).addClass("paid");
            } else {
                $(this.el).removeClass("paid");
            }
        },
    });

    screens.ActionpadWidget.include({
        click_validate_paid_order: function() {
            var self = this;
            var order = this.pos.get_order();
            var title = _t("Order Validate");
            var body = order.hasChangesToPrint()
                ? _t(
                      "You have not printed products in the kitchen. Validate without print?"
                  )
                : _t("Confirm the paid order?");
            this.pos.gui.show_popup("confirm", {
                title: title,
                body: body,
                confirm: function() {
                    self.validate_paid_order();
                },
            });
        },
        validate_paid_order: function() {
            var order = this.pos.get_order();
            var cashregister = this.pos.get_mp_cashregister();
            order.add_paymentline(cashregister);
            var amount = order.get_total_with_tax();
            order.selected_paymentline.set_amount(amount);
            if (order.is_paid()) {
                this.finalize_validation();
            }
        },
        finalize_validation: function() {
            var self = this;
            var order = this.pos.get_order();
            order.initialize_validation_date();
            order.finalized = true;

            if (order.is_to_invoice()) {
                var invoiced = this.pos.push_and_invoice_order(order);
                this.invoicing = true;

                invoiced.fail(function(error) {
                    self.invoicing = false;
                    order.finalized = false;
                    if (error.message === "Missing Customer") {
                        self.gui.show_popup("confirm", {
                            title: _t("Please select the Customer"),
                            body: _t(
                                "You need to select the customer before you can invoice an order."
                            ),
                            confirm: function() {
                                self.gui.show_screen("clientlist");
                            },
                        });
                    } else if (error.code < 0) {
                        // XmlHttpRequest Errors
                        self.gui.show_popup("error", {
                            title: _t("The order could not be sent"),
                            body: _t("Check your internet connection and try again."),
                        });
                    } else if (error.code === 200) {
                        // OpenERP Server Errors
                        self.gui.show_popup("error-traceback", {
                            title: error.data.message || _t("Server Error"),
                            body:
                                error.data.debug ||
                                _t(
                                    "The server encountered an error while receiving your order."
                                ),
                        });
                    } else {
                        // Other Error
                        self.gui.show_popup("error", {
                            title: _t("Unknown Error"),
                            body: _t(
                                "The order could not be sent to the server due to an unknown error"
                            ),
                        });
                    }
                });
                invoiced.done(function() {
                    self.invoicing = false;
                    self.gui.show_screen("receipt");
                });
            } else {
                this.pos.push_order(order);
                this.gui.show_screen("receipt");
            }
        },
    });

    screens.OrderWidget.include({
        rerender_orderline: function(order_line) {
            if (order_line.node && order_line.node.parentNode) {
                var available_pos_product_qty = this.pos.db.get_product_by_id(
                    order_line.product.id
                ).available_pos_product_qty;
                order_line.available_pos_product_qty = available_pos_product_qty;
                return this._super(order_line);
            }
        },
    });

    return screens;
});
