/*  Copyright 2014 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
    Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_scan_ref.pos", function(require) {
    "use strict";

    var devices = require("point_of_sale.devices");
    var PosDb = require("point_of_sale.DB");
    var models = require("point_of_sale.models");

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        scan_product: function(parsed_code) {
            var selectedOrder = this.get_order();
            var product = this.db.get_product_by_reference(parsed_code.code);
            if (parsed_code.encoding === "reference") {
                if (!product) {
                    return false;
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
            }
            return PosModelSuper.prototype.scan_product.apply(this, arguments);
        },
    });

    devices.BarcodeReader.include({
        scan: function(code) {
            var parsed_result = {};
            if (this.pos.db.get_product_by_reference(code)) {
                parsed_result = {
                    encoding: "reference",
                    type: "product",
                    code: code,
                };
                this.action_callback[parsed_result.type](parsed_result);
            } else if (this.pos.db.get_product_by_reference("0" + code)) {
                parsed_result = {
                    encoding: "reference",
                    type: "product",
                    code: "0" + code,
                };
                this.action_callback[parsed_result.type](parsed_result);
            } else {
                this._super(code);
            }
        },
    });

    PosDb.include({
        init: function(options) {
            this._super(options);
            this.product_by_reference = {};
        },
        add_products: function(products) {
            this._super(products);
            for (var i = 0, len = products.length; i < len; i++) {
                var product = products[i];
                if (product.default_code) {
                    this.product_by_reference[product.default_code] = product;
                }
            }
        },
        get_product_by_reference: function(ref) {
            return this.product_by_reference[ref];
        },
    });
});
