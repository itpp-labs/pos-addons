/*  Copyright 2016 Stanislav Krotov <https://it-projects.info/team/ufaks>
    Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_product_available_negative.pos", function(require) {
    "use strict";

    var screens = require("point_of_sale.screens");
    var models = require("point_of_sale.models");
    var core = require("web.core");
    var _t = core._t;

    models.PosModel = models.PosModel.extend({
        check_product_available_qty: function(product, quantity_to_add) {
            var orderlines = this.get_order().get_orderlines();
            var product_quantity_to_buy = 0;
            for (var i = 0; i < orderlines.length; i++) {
                var line = orderlines[i];
                if (line.product.id === product.id) {
                    product_quantity_to_buy += line.quantity;
                }
            }
            if (product_quantity_to_buy + quantity_to_add > product.qty_available) {
                this.gui.show_popup("alert", {
                    title: _t("Quantity exceeded available"),
                    body: _t(
                        "You've entered quantity of product that exceeded available in stock"
                    ),
                });
            }
        },
    });

    screens.PaymentScreenWidget.include({
        validate_order: function(force_validation) {
            var self = this;
            var _super = this._super;

            if (!this.pos.config.negative_order_manager_permission) {
                return this._super(force_validation);
            }

            var order = this.pos.get_order();
            var orderlines = order.get_orderlines();
            var has_negative_product = false;
            var unique_products = {};

            for (var i = 0; i < orderlines.length; i++) {
                var line = orderlines[i];
                if (unique_products[line.product.id]) {
                    unique_products[line.product.id] += line.quantity;
                } else {
                    unique_products[line.product.id] = line.quantity;
                }
                if (
                    line.product.type === "product" &&
                    line.product.qty_available < unique_products[line.product.id]
                ) {
                    has_negative_product = true;
                }
            }

            if (!has_negative_product) {
                this._super(force_validation);
            } else {
                self.gui
                    .sudo_custom({
                        title: _t(
                            "Order has out-of-stock product and must be approved by supervisor"
                        ),
                        special_group: this.pos.config.negative_order_group_id[0],
                        do_not_change_cashier: true,
                        "product-imgarguments": {ask_untill_correct: true},
                    })
                    .done(function(user) {
                        order.negative_stock_user_id = user;
                        _super.call(self, force_validation);
                    });
                // Break;
            }
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        export_as_JSON: function() {
            var json = _super_order.export_as_JSON.apply(this, arguments);
            json.negative_stock_user_id = this.negative_stock_user_id
                ? this.negative_stock_user_id.id
                : false;
            return json;
        },
    });

    screens.ProductListWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);
            if (!this.pos.config.negative_order_warning) {
                return;
            }
            var click_product_handler_super = this.click_product_handler;
            this.click_product_handler = function() {
                var product = self.pos.db.get_product_by_id(this.dataset.productId);
                if (product.type === "product") {
                    if (product.qty_available <= 0) {
                        return self.gui.show_popup("alert", {
                            title: _t("The product is out of stock"),
                            body: _t("It's unavailable to add the product"),
                        });
                    }
                    self.pos.check_product_available_qty(product, 1);
                }
                _.bind(click_product_handler_super, this)();
            };
        },
    });

    screens.OrderWidget.include({
        set_value: function(val) {
            if (!this.pos.config.negative_order_warning) {
                this._super();
                return;
            }
            var order = this.pos.get_order();
            if (!order.get_selected_orderline()) {
                return;
            }
            var mode = this.numpad_state.get("mode");
            if (mode !== "quantity") {
                return;
            }
            var selected_orderline = order.get_selected_orderline();
            var product = this.pos.db.get_product_by_id(selected_orderline.product.id);
            if (product.type === "product") {
                selected_orderline.set_quantity(0);
                this.pos.check_product_available_qty(product, parseInt(val));
                selected_orderline.set_quantity(val);
            }
        },
    });
});
