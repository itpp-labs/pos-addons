// TODO
/* eslint-disable no-param-reassign */
odoo.define("pos_product_lot.PosLot", function(require) {
    "use strict";

    var models = require("point_of_sale.models");
    var PosDB = require("point_of_sale.DB");
    var screens = require("point_of_sale.screens");
    var Model = require("web.Model");

    // From http://vk.com/js/common.js
    function geByClass(searchClass, node, tag) {
        var classElements = [];
        if (!node) {
            node = document;
        }
        if (!tag) {
            tag = "*";
        }
        if (node.getElementsByClassName) {
            classElements = node.getElementsByClassName(searchClass);
            if (tag !== "*") {
                for (var i = 0; i < classElements.length; i++) {
                    if (classElements.nodeName === tag) {
                        classElements.splice(i, 1);
                    }
                }
            }
            return classElements;
        }
        var els = node.getElementsByTagName(tag);
        var pattern = new RegExp("(^|\\s)" + searchClass + "(\\s|$)");
        var j = 0;
        for (i = 0, j = 0; i < els.length; i++) {
            if (pattern.test(els[i].className)) {
                classElements[j] = els[i];
                j++;
            }
        }
        return classElements;
    }

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(session, attributes) {
            var product_model = _.find(this.models, function(model) {
                return model.model === "product.product";
            });
            product_model.fields.push("is_lot", "lot_qty", "lot_product_id", "lot_id");
            return PosModelSuper.prototype.initialize.call(this, session, attributes);
        },
        flush: function() {
            var old_flushed = PosModelSuper.prototype.flush.call(this);

            var self = this;
            var flushed = new $.Deferred();

            old_flushed
                .done(function() {
                    self.flush_mutex.exec(function() {
                        var done = new $.Deferred();

                        self._flush_all_split_lot()
                            .done(function() {
                                flushed.resolve();
                            })
                            .fail(function() {
                                flushed.reject();
                            })
                            .always(function() {
                                done.resolve();
                            });
                        return done;
                    });
                })
                .fail(function() {
                    flushed.reject();
                });
            return flushed;
        },
        scan_product: function(parsed_code) {
            var product = {};
            var selectedOrder = this.get("selectedOrder");
            if (parsed_code.encoding === "ean13") {
                product = this.db.get_product_by_ean13(parsed_code.base_code);
            } else if (parsed_code.encoding === "reference") {
                product = this.db.get_product_by_reference(parsed_code.code);
            }

            if (!product) {
                return false;
            }

            // Added code
            if (product.lot_id) {
                var lot_product = this.db.get_product_by_id(product.lot_id[0]);
                if (
                    (parsed_code.encoding === "ean13" &&
                        lot_product.ean13 === parsed_code.base_code) ||
                    (parsed_code.encoding === "reference" &&
                        lot_product.default_code === parsed_code.code)
                ) {
                    // Lot with same code has priority
                    product = lot_product;
                }
            } else {
                return PosModelSuper.prototype.scan_product.apply(this, arguments);
            }

            if (parsed_code.type === "price") {
                selectedOrder.add_product(product, {price: parsed_code.value});
            } else if (parsed_code.type === "weight") {
                selectedOrder.add_product(product, {
                    quantity: parsed_code.value,
                    merge: false,
                });
            } else if (parsed_code.type === "discount") {
                selectedOrder.add_product(product, {
                    discount: parsed_code.value,
                    merge: false,
                });
            } else {
                selectedOrder.add_product(product);
            }
            return true;
        },

        /* Push to server */

        _flush_all_split_lot: function() {
            var self = this;
            self.set("synch", {
                state: "connecting",
                pending: self.get("synch").pending,
            });
            return self
                ._save_to_server_split_lot(self.db.get_split_lot_records())
                .done(function() {
                    var pending = self.db.get_split_lot_records().length;
                    self.set("synch", {
                        state: pending ? "connecting" : "connected",
                        pending: pending,
                    });
                });
        },
        _save_to_server_split_lot: function(records, options) {
            records = records.slice();
            if (!records || !records.length) {
                var result = $.Deferred();
                result.resolve();
                return result;
            }

            options = options || {};

            var self = this;
            var timeout =
                typeof options.timeout === "number"
                    ? options.timeout
                    : 7500 * records.length;

            // We try to send the order. shadow prevents a spinner if it takes too long. (unless we are sending an invoice,
            // then we want to notify the user that we are waiting on something )
            var ppModel = new Model("product.product");
            return ppModel
                .call(
                    "split_lot_from_ui",
                    [[], records],
                    {context: {location: self.config.stock_location_id[0]}},
                    {
                        shadow: true,
                        timeout: timeout,
                    }
                )
                .then(function() {
                    _.each(records, function(r) {
                        self.db.remove_split_lot(r.id);
                    });
                })
                .fail(function(unused, event) {
                    // Prevent an error popup creation by the rpc failure
                    // we want the failure to be silent as we send the records in the background
                    event.preventDefault();
                    console.error("Failed to send records:", records);
                });
        },
        push_split_lot: function(product, qty) {
            var self = this;

            this.db.add_split_lot({
                product: {id: product.id},
                qty: qty || 1,
            });
            var pushed = new $.Deferred();

            this.set("synch", {
                state: "connecting",
                pending: self.db.get_split_lot_records().length,
            });

            this.flush_mutex.exec(function() {
                var flushed = self._flush_all_split_lot();

                flushed.always(function() {
                    pushed.resolve();
                });

                return flushed;
            });
            return pushed;
        },
    });
    PosDB.include({
        getTime: function() {
            return String(new Date().getTime());
        },
        getUniqueTime: function() {
            var time = this.getTime();
            while (time === this.getTime()) {
                return this.getTime();
            }
        },
        add_split_lot: function(r) {
            var records = this.load("split_lot_records", []);

            r.id = this.getUniqueTime();

            records.push(r);

            this.save("split_lot_records", records);
        },
        remove_split_lot: function(id) {
            var records = this.load("split_lot_records", []);
            records = _.filter(records, function(order) {
                return order.id !== id;
            });
            this.save("split_lot_records", records);
        },
        get_split_lot_records: function() {
            return this.load("split_lot_records", []);
        },
    });

    screens.OrderWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);

            this.unpack_lot_handler = function() {
                var product = this.orderline.product;
                console.log(product);
                var lot_product = self.pos.db.get_product_by_id(product.lot_id[0]);
                var qty = 1;

                lot_product.qty_available -= qty;
                product.qty_available += qty * lot_product.lot_qty;

                self.rerender_orderline(this.orderline);
                self.pos.refresh_qty_available(product);
                self.pos.refresh_qty_available(lot_product);
                self.pos.push_split_lot(lot_product, qty);
                self.renderElement();
            };
        },
        render_orderline: function(orderline) {
            var el_node = this._super(orderline);
            var button = geByClass("unpack-lot", el_node);
            if (button && button.length) {
                button = button[0];
                button.orderline = orderline;
                button.addEventListener("click", this.unpack_lot_handler);
            }

            return el_node;
        },
    });
});
