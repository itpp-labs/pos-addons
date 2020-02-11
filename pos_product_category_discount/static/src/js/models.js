odoo.define("pos_product_category_discount.models", function(require) {
    "use strict";

    var models = require("point_of_sale.models");
    var Model = require("web.Model");

    models.load_models({
        model: "pos.discount_program",
        fields: [],
        domain: function(self) {
            return [["discount_program_active", "=", true]];
        },
        loaded: function(self, discount_program) {
            var sorting_discount_program = function(idOne, idTwo) {
                return idOne.discount_program_number - idTwo.discount_program_number;
            };
            if (discount_program) {
                self.discount_program = discount_program.sort(sorting_discount_program);
            }
        },
    });

    models.load_models({
        model: "pos.category_discount",
        fields: [],
        loaded: function(self, category_discount) {
            if (category_discount) {
                self.discount_categories = category_discount;
            }
        },
    });

    models.load_fields("product.product", ["discount_allowed"]);
    models.load_fields("res.partner", ["discount_program_id"]);

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(session, attributes) {
            // <new-code>
            var self = this;
            var product_model = _.find(this.models, function(model) {
                return model.model === "product.product";
            });
            var loaded_super = product_model.loaded;
            product_model.loaded = function(that, products) {
                loaded_super(that, products);
                if (self.config.iface_discount) {
                    self.load_discount_product(product_model.fields);
                }
            };
            // </new-code>
            return PosModelSuper.prototype.initialize.call(this, session, attributes);
        },
        load_discount_product: function(fields) {
            var self = this;
            var discount_product_id = this.config.discount_product_id[0];
            var product = this.db.get_product_by_id(discount_product_id);
            if (!product) {
                new Model("product.product")
                    .call("search_read", [[["id", "=", discount_product_id]]], {
                        fields: fields,
                    })
                    .then(function(p) {
                        if (p instanceof Array) {
                            p[0].available_in_pos = false;
                        } else {
                            p.available_in_pos = false;
                        }
                        self.db.add_products(p);
                    });
            }
        },
        get_discount_categories: function(id) {
            return _.filter(this.discount_categories, function(item) {
                return item.discount_program_id[0] === id;
            });
        },
        set_discount_categories_by_program_id: function(id) {
            if (this.config.iface_discount) {
                var self = this;
                var discount_categories = this.get_discount_categories(id);
                var order = this.get_order();
                if (discount_categories) {
                    order.remove_all_discounts();
                    discount_categories.forEach(function(discount) {
                        self.apply_discount_category(discount);
                    });
                }
            }
        },
        apply_discount_category: function(discount) {
            var order = this.get_order();
            var lines = order.get_orderlines().filter(function(item) {
                if (item.product.pos_category_ids) {
                    return (
                        item.product.pos_category_ids.indexOf(
                            discount.discount_category_id[0]
                        ) !== -1 && item.product.discount_allowed
                    );
                }
                return (
                    item.product.pos_categ_id[0] === discount.discount_category_id[0] &&
                    item.product.discount_allowed
                );
            });
            lines.forEach(function(line) {
                line.discount_program_name = discount.discount_program_id[1];
                line.set_discount(discount.category_discount_pc);
            });
            order.discount_program_id = discount.discount_program_id[0];
            order.discount_program_name = discount.discount_program_id[1];
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        remove_all_discounts: function() {
            if (this.pos.config.iface_discount) {
                this.discount_program_id = false;
                this.get_orderlines().forEach(function(line) {
                    if (line.discount_program_name) {
                        line.set_discount(false);
                    }
                });
            }
        },
        export_as_JSON: function() {
            var json = OrderSuper.prototype.export_as_JSON.call(this);
            json.product_discount = this.product_discount || false;
            json.discount_program_id = this.discount_program_id;
            json.discount_program_name = this.discount_program_name;
            json.discount_percent = this.discount_percent;
            return json;
        },
        init_from_JSON: function(json) {
            OrderSuper.prototype.init_from_JSON.apply(this, arguments);
            this.product_discount = json.product_discount || false;
            this.discount_program_id = json.discount_program_id;
            this.discount_program_name = json.discount_program_name;
            this.discount_percent = json.discount_percent;
        },
    });

    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr, options) {
            OrderlineSuper.prototype.initialize.apply(this, arguments);
            if (
                this.order &&
                this.order.discount_program_id &&
                this.product.discount_allowed
            ) {
                this.apply_product_discount(this.order.discount_program_id);
            }
        },
        apply_product_discount: function(id) {
            var self = this;
            var discount_categories = this.pos.get_discount_categories(id);
            discount_categories.forEach(function(res) {
                if (
                    (self.product.pos_category_ids &&
                        self.product.pos_category_ids.indexOf(
                            res.discount_category_id[0]
                        ) !== -1) ||
                    (self.product.pos_categ_id &&
                        res.discount_category_id[0] === self.product.pos_categ_id[0])
                ) {
                    self.discount_program_name = res.discount_program_id[1];
                    self.set_discount(res.category_discount_pc);
                }
            });
        },
        export_as_JSON: function() {
            var json = OrderlineSuper.prototype.export_as_JSON.call(this);
            json.discount_program_name = this.discount_program_name || false;
            return json;
        },
        init_from_JSON: function(json) {
            OrderlineSuper.prototype.init_from_JSON.apply(this, arguments);
            this.discount_program_name = json.discount_program_name || false;
        },
        get_discount_name: function() {
            return this.discount_program_name;
        },
    });
});
