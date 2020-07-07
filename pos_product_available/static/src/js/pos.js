/*  Copyright 2014-2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
    Copyright 2016 gaelTorrecillas <https://github.com/gaelTorrecillas>
    Copyright 2016 manawi <https://github.com/manawi>
    Copyright 2017 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
    Copyright 2018,2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_product_available.PosModel", function(require) {
    "use strict";

    var rpc = require("web.rpc");
    var models = require("point_of_sale.models");
    var field_utils = require("web.field_utils");

    var PosModelSuper = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        load_server_data: function() {
            var self = this;

            var loaded = PosModelSuper.load_server_data.call(this);

            var prod_model = _.find(this.models, function(model) {
                return model.model === "product.product";
            });

            if (prod_model) {
                prod_model.fields.push("qty_available", "type");
                var context_super = prod_model.context;
                prod_model.context = function(that) {
                    var ret = context_super(that);
                    ret.location = that.config.stock_location_id[0];
                    return ret;
                };
                var loaded_super = prod_model.loaded;
                prod_model.loaded = function(that, products) {
                    loaded_super(that, products);
                    self.db.product_qtys = products;
                };
                return loaded;
            }

            return loaded.then(function() {
                return rpc
                    .query({
                        model: "product.product",
                        method: "search_read",
                        args: [],
                        fields: ["qty_available", "type"],
                        domain: [
                            ["sale_ok", "=", true],
                            ["available_in_pos", "=", true],
                        ],
                        context: {location: self.config.stock_location_id[0]},
                    })
                    .then(function(products) {
                        self.db.product_qtys = products;
                    });
            });
        },
        set_product_qty_available: function(product, qty) {
            product.qty_available = qty;
            this.refresh_qty_available(product);
        },
        update_product_qty_from_order_lines: function(order) {
            var self = this;
            order.orderlines.each(function(line) {
                var product = line.get_product();
                product.qty_available = Math.round(
                    product.qty_available - line.get_quantity(),
                    {digits: [69, 3]}
                );
                self.refresh_qty_available(product);
            });
            // Compatibility with pos_multi_session
            order.trigger("new_updates_to_send");
        },
        after_load_server_data: function() {
            var self = this;
            var res = PosModelSuper.after_load_server_data.apply(this, arguments);
            _.each(this.db.product_qtys, function(v) {
                _.extend(self.db.get_product_by_id(v.id), v);
            });
            return res;
        },
        refresh_qty_available: function(product) {
            var $elem = $("[data-product-id='" + product.id + "'] .qty-tag");
            $elem.html(product.rounded_qty());
            if (product.qty_available <= 0 && !$elem.hasClass("not-available")) {
                $elem.addClass("not-available");
            }
        },
        push_order: function(order, opts) {
            var pushed = PosModelSuper.push_order.call(this, order, opts);
            if (order) {
                this.update_product_qty_from_order_lines(order);
            }
            return pushed;
        },
        push_and_invoice_order: function(order) {
            var invoiced = PosModelSuper.push_and_invoice_order.call(this, order);

            if (order && order.get_client() && order.orderlines) {
                this.update_product_qty_from_order_lines(order);
            }

            return invoiced;
        },
    });

    models.Product = models.Product.extend({
        get_price: function(pricelist, quantity) {
            var self = this;
            var date = moment().startOf("day");

            // In case of nested pricelists, it is necessary that all pricelists are made available in
            // the POS. Display a basic alert to the user in this case.
            if (pricelist === undefined) {
                // eslint-disable-next-line
                alert(
                    "An error occurred when loading product prices. " +
                        "Make sure all pricelists are available in the POS."
                );
            }

            var category_ids = [];
            var category = this.categ;
            while (category) {
                category_ids.push(category.id);
                category = category.parent;
            }

            /*
            So, with pos_product_available it doesnt work correctly, cause
            'item.product_tmpl_id || item.product_tmpl_id[0] === self.product_tmpl_id'
            in this string are comparing integer with an array of two elements.
            Changed: 'self.product_tmpl_id -> self.product_tmpl_id[0]',
            where 'self.product_tmpl_id[0]' product template id.
            By the way, here's comparing products ids.
            IMPORTANT: Changed line - (!item.product_tmpl_id || item.product_tmpl_id[0] === self.product_tmpl_id[0]).
            */
            var pricelist_items = _.filter(pricelist.items, function(item) {
                return (
                    (!item.product_tmpl_id ||
                        item.product_tmpl_id[0] === self.product_tmpl_id[0]) &&
                    (!item.product_id || item.product_id[0] === self.id) &&
                    (!item.categ_id || _.contains(category_ids, item.categ_id[0])) &&
                    (!item.date_start ||
                        moment(item.date_start).isSameOrBefore(date)) &&
                    (!item.date_end || moment(item.date_end).isSameOrAfter(date))
                );
            });

            var price = self.lst_price;
            _.find(pricelist_items, function(rule) {
                if (rule.min_quantity && quantity < rule.min_quantity) {
                    return false;
                }

                if (rule.base === "pricelist") {
                    price = self.get_price(rule.base_pricelist, quantity);
                } else if (rule.base === "standard_price") {
                    price = self.standard_price;
                }

                if (rule.compute_price === "fixed") {
                    price = rule.fixed_price;
                    return true;
                } else if (rule.compute_price === "percentage") {
                    price -= price * (rule.percent_price / 100);
                    return true;
                }
                var price_limit = price;
                price -= price * (rule.price_discount / 100);
                if (rule.price_round) {
                    // eslint-disable-next-line
                    price = round_pr(price, rule.price_round);
                }
                if (rule.price_surcharge) {
                    price += rule.price_surcharge;
                }
                if (rule.price_min_margin) {
                    price = Math.max(price, price_limit + rule.price_min_margin);
                }
                if (rule.price_max_margin) {
                    price = Math.min(price, price_limit + rule.price_max_margin);
                }
                return true;
            });

            // This return value has to be rounded with round_di before
            // being used further. Note that this cannot happen here,
            // because it would cause inconsistencies with the backend for
            // pricelist that have base == 'pricelist'.
            return price;
        },
    });

    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        export_as_JSON: function() {
            var data = OrderlineSuper.prototype.export_as_JSON.apply(this, arguments);
            data.qty_available = this.product.qty_available;
            return data;
        },
        // Compatibility with pos_multi_session
        apply_ms_data: function(data) {
            if (OrderlineSuper.prototype.apply_ms_data) {
                OrderlineSuper.prototype.apply_ms_data.apply(this, arguments);
            }
            var product = this.pos.db.get_product_by_id(data.product_id);
            if (product.qty_available !== data.qty_available) {
                this.pos.set_product_qty_available(product, data.qty_available);
            }
        },
    });

    models.Product = models.Product.extend({
        format_float_value: function(val) {
            var value = parseFloat(val);
            value = field_utils.format.float(value, {digits: [69, 3]});
            return String(parseFloat(value));
        },
        /*
        Commented this code, cause it works incorrect
        Example: "this.format_float_value(2366) === 2"
        rounded_qty: function() {
            return this.format_float_value(this.qty_available);
        },
        */
        rounded_qty: function() {
            return Math.round(this.qty_available);
        },
    });
});
