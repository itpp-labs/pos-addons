/* Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_alipay", function(require) {
    "use strict";

    require("pos_qr_scan");
    require("pos_qr_show");
    var rpc = require("web.rpc");
    var core = require("web.core");
    var models = require("point_of_sale.models");

    models.load_fields("account.journal", ["alipay"]);

    var exports = {};

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function() {
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.alipay = new exports.Alipay(this);

            this.bus.add_channel_callback("alipay", this.on_alipay, this);
            this.ready.then(function() {
                // Take out alipay scan cashregister from cashregisters to avoid
                // rendering in payment screent
                self.scan_journal = self.hide_cashregister(function(r) {
                    return r.alipay === "scan";
                });
            });
        },
        scan_product: function(parsed_code) {
            // TODO: do we need to make this optional?
            var value = parsed_code.code;
            if (this.alipay.check_auth_code(value)) {
                this.alipay.process_qr(value);
                return true;
            }
            return PosModelSuper.prototype.scan_product.apply(this, arguments);
        },
        on_alipay: function(msg) {
            this.add_qr_payment(
                msg.order_ref,
                msg.journal_id,
                msg.total_fee / 100.0,
                {
                    scan_id: msg.scan_id,
                },
                // Auto validate payment
                true
            );
        },
        alipay_qr_payment: function(order, creg) {
            /* Send request asynchronously */
            var self = this;

            var pos = this;
            var terminal_ref = "POS/" + pos.config.name;
            var pos_id = pos.config.id;

            var lines = order.orderlines.map(function(r) {
                return {
                    // Always use 1 because quantity is taken into account in price field
                    quantity: 1,
                    quantity_full: r.get_quantity(),
                    price: r.get_price_with_tax(),
                    product_id: r.get_product().id,
                };
            });

            // Send without repeating on failure
            return rpc
                .query({
                    model: "alipay.order",
                    method: "create_qr",
                    kwargs: {
                        lines: lines,
                        subject: order.name,
                        order_ref: order.uid,
                        pay_amount: order.get_due(),
                        terminal_ref: terminal_ref,
                        pos_id: pos_id,
                        journal_id: creg.journal.id,
                    },
                })
                .then(function(data) {
                    if (data.code_url) {
                        self.on_payment_qr(order, data.code_url);
                    } else if (data.error) {
                        self.show_warning(data.error);
                    } else {
                        self.show_warning("Unknown error");
                    }
                });
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        add_paymentline: function(cashregister) {
            if (cashregister.journal.alipay === "show") {
                this.pos.alipay_qr_payment(this, cashregister);
                return;
            }
            return OrderSuper.prototype.add_paymentline.apply(this, arguments);
        },
    });

    var PaymentlineSuper = models.Paymentline;
    models.Paymentline = models.Paymentline.extend({
        initialize: function(attributes, options) {
            PaymentlineSuper.prototype.initialize.apply(this, arguments);
            this.scan_id = options.scan_id;
        },
        // TODO: do we need to extend init_from_JSON too ?
        export_as_JSON: function() {
            var res = PaymentlineSuper.prototype.export_as_JSON.apply(this, arguments);
            res.scan_id = this.scan_id;
            return res;
        },
    });

    exports.Alipay = window.Backbone.Model.extend({
        initialize: function(pos) {
            var self = this;
            this.pos = pos;
            core.bus.on("qr_scanned", this, function(value) {
                if (self.check_auth_code(value)) {
                    self.process_qr(value);
                }
            });
        },
        check_auth_code: function(code) {
            // TODO: do we need to integrate this with barcode.nomenclature?
            var beginning = code.substring(0, 2);
            if (
                code &&
                Number.isInteger(Number(code)) &&
                code.length >= 16 &&
                code.length <= 24 &&
                Number(beginning) >= 25 &&
                Number(beginning) <= 30
            ) {
                return true;
            }
            return false;
        },
        process_qr: function(auth_code) {
            var order = this.pos.get_order();
            if (!order) {
                return;
            }
            // TODO: block order for editing
            this.scan(auth_code, order);
        },
        scan: function(auth_code, order) {
            /* Send request asynchronously */
            var self = this;

            var terminal_ref = "POS/" + self.pos.config.name;
            var pos_id = self.pos.config.id;

            var send_it = function() {
                return rpc.query({
                    model: "alipay.order",
                    method: "pos_create_from_qr",
                    kwargs: {
                        auth_code: auth_code,
                        total_amount: order.get_due(),
                        order_ref: order.uid,
                        subject: order.name,
                        terminal_ref: terminal_ref,
                        journal_id: self.pos.scan_journal.id,
                        pos_id: pos_id,
                    },
                });
            };

            var current_send_number = 0;
            return send_it().fail(function(error, e) {
                if (self.pos.debug) {
                    console.log(
                        "Alipay",
                        self.pos.config.name,
                        "failed request #" + current_send_number + ":",
                        error.message
                    );
                }
                self.pos.show_warning();
            });
        },
    });
    return exports;
});
