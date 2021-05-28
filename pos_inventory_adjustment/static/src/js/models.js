/* Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_inventory_adjustment.models", function(require) {
    "use strict";

    var models = require("point_of_sale.models");
    var Model = require("web.DataModel");

    models.load_models({
        model: "stock.inventory",
        condition: function(self) {
            return self.config.inventory_adjustment;
        },
        fields: ["name"],
        domain: [
            ["filter", "=", "staged"],
            ["state", "=", "draft"],
        ],
        loaded: function(self, inventories) {
            self.db.inventories = inventories;
        },
    });

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function(session, attributes) {
            var product_model = _.find(this.models, function(model) {
                return model.model === "product.product";
            });
            var product_domain = product_model.domain;
            product_model.domain = function(self) {
                return self.config.inventory_adjustment ? [] : product_domain;
            };
            product_model.domain = function(self) {
                return self.config.inventory_adjustment ? [] : product_domain;
            };
            _super_posmodel.initialize.call(this, session, attributes);
            var self = this;
            this.ready.then(function() {
                var inv_id = self.config.inventory_adjustment_temporary_inv_id;
                if (inv_id) {
                    var inv_order = _.find(self.get_order_list(), function(o) {
                        return o.inventory_adjustment_stage_id === inv_id[0];
                    });
                    if (inv_order) {
                        self.set_order(inv_order);
                    } else {
                        self.get_inventory_stages([inv_id[0]]).then(function(inv) {
                            inv = inv[0];
                            self.get_inventory_stage_lines(inv.line_ids).then(function(
                                lines
                            ) {
                                self.create_inventory_order(inv, {
                                    inv_adj_lines: lines,
                                });
                            });
                        });
                    }
                }
            });
        },

        get_inventory_stages: function(ids) {
            if (ids) {
                return new Model("stock.inventory.stage")
                    .call("search_read", [[["id", "in", ids]]], {
                        fields: ["name", "inventory_id", "user_id", "line_ids"],
                    })
                    .then(
                        function(inv_stages) {
                            return inv_stages;
                        },
                        function(err) {
                            console.log(err);
                        }
                    );
            }
            return new Model("stock.inventory.stage")
                .call("search_read", [[["state", "=", "open"]]], {
                    fields: ["name", "inventory_id", "user_id", "line_ids"],
                })
                .then(
                    function(inv_stages) {
                        return inv_stages;
                    },
                    function(err) {
                        console.log(err);
                    }
                );
        },

        get_inventory_stage_lines: function(ids) {
            return new Model("stock.inventory.stage.line").call("read", [ids]).then(
                function(lines) {
                    return lines;
                },
                function(err) {
                    console.log(err);
                }
            );
        },

        create_inventory_order: function(stage, options) {
            var self = this;
            var order = new models.Order(
                {},
                {
                    pos: this,
                }
            );
            this.get("orders").add(order);
            this.set_order(order);
            order.inventory_adjustment_stage_id = stage.id;
            order.inventory_adjustment_stage_name = stage.name;
            this.gui.screen_instances.products.product_categories_widget.renderElement();

            if (!options) {
                return;
            }
            var product = false;
            _.each(options.inv_adj_lines, function(l) {
                product = self.db.get_product_by_id(l.product_id[0]);
                order.add_product(product, {
                    quantity: l.qty,
                });
                order.selected_orderline.line_id = l.id;
            });
        },

        send_inventory_stage: function() {
            var order = this.get_order();
            var order_to_send = {
                inventory_adjustment_stage_id: order.inventory_adjustment_stage_id,
                lines: _.map(order.get_orderlines(), function(l) {
                    return {
                        product_id: l.product.id,
                        qty: l.quantity,
                        line_id: l.line_id,
                    };
                }),
            };
            return new Model("stock.inventory.stage").call("update_stage_from_ui", [
                order.inventory_adjustment_stage_id,
                order_to_send,
            ]);
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        export_as_JSON: function() {
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.inventory_adjustment_stage_id = this.inventory_adjustment_stage_id;
            data.inventory_adjustment_stage_name = this.inventory_adjustment_stage_name;
            return data;
        },

        init_from_JSON: function(json) {
            _super_order.init_from_JSON.call(this, json);
            this.inventory_adjustment_stage_id = json.inventory_adjustment_stage_id;
            this.inventory_adjustment_stage_name = json.inventory_adjustment_stage_name;
        },

        add_product: function(product, options) {
            if (!this.pos.config.inventory_adjustment) {
                return _super_order.add_product.call(this, product, options);
            }
            var same_product_orderline = _.find(this.get_orderlines(), function(ol) {
                return ol.product.id === product.id;
            });
            if (same_product_orderline) {
                var previous_qty = same_product_orderline.get_quantity();
                same_product_orderline.set_quantity(previous_qty + 1);
            } else {
                return _super_order.add_product.call(this, product, options);
            }
        },

        get_total_qty: function() {
            return _.reduce(
                this.get_orderlines(),
                function(memo, num) {
                    return memo + num.quantity;
                },
                0
            );
        },
    });
});
