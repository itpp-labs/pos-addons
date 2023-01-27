//  Copyright 2018 Artyom Losev
//  Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
//  Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
//  License MIT (https://opensource.org/licenses/MIT).
/* eslint no-useless-escape: "off"*/
odoo.define("pos_invoices", function (require) {
    var models = require("point_of_sale.models");
    var PosDb = require("point_of_sale.DB");
    var utils = require("web.utils");
    var rpc = require("web.rpc");

    var round_pr = utils.round_precision;

    models.load_models({
        model: "sale.order",
        fields: [
            "name",
            "partner_id",
            "date_order",
            "user_id",
            "amount_total",
            "order_line",
            "invoice_status",
        ],
        domain: [
            ["invoice_status", "=", "to invoice"],
            ["state", "=", "sale"],
        ],
        loaded: function (self, sale_orders) {
            var so_ids = _.pluck(sale_orders, "id");
            self.prepare_so_data(sale_orders);
            self.sale_orders = sale_orders;
            self.db.add_sale_orders(sale_orders);
            self.get_sale_order_lines(so_ids);
        },
    });

    models.load_models({
        model: "account.move",
        fields: [
            "name",
            "partner_id",
            "invoice_date",
            "invoice_date_due",
            "invoice_origin",
            "amount_total",
            "invoice_user_id",
            "amount_residual",
            "payment_state",
            "amount_untaxed",
            "amount_tax",
            "state",
            "move_type",
        ],
        domain: [
            ["payment_state", "in", ["not_paid", "partial"]],
            ["state", "=", "posted"],
            ["move_type", "=", "out_invoice"],
        ],
        loaded: function (self, invoices) {
            _.each(invoices, function (invoice) {
                invoice.user_id = invoice.invoice_user_id;
            });

            var invoices_ids = _.pluck(invoices, "id");
            self.prepare_invoices_data(invoices);
            self.invoices = invoices;
            self.db.add_invoices(invoices);
            self.get_invoice_lines(invoices_ids);
        },
    });

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            _super_posmodel.initialize.apply(this, arguments);
            this.bus.add_channel_callback(
                "pos_sale_orders",
                this.on_notification,
                this
            );
            this.bus.add_channel_callback("pos_invoices", this.on_notification, this);
        },

        get_sale_order_lines: function (ids) {
            var self = this;
            return rpc
                .query({
                    model: "sale.order",
                    method: "get_order_lines_for_pos",
                    args: [ids],
                })
                .then(function (lines) {
                    _.each(lines, function (l) {
                        var so = self.db.sale_orders_by_id[l.order_id];
                        if (!so) {
                            return;
                        }
                        so.lines = so.lines || [];
                        // Escape duplicates
                        if (
                            so.lines.every((existing_line) => existing_line.id !== l.id)
                        ) {
                            so.lines.push(l);
                        }
                    });
                });
        },

        get_invoice_lines: function (data) {
            data = data || [];
            return rpc
                .query({
                    model: "account.move",
                    method: "get_invoice_lines_for_pos",
                    args: [data],
                })
                .then((lines) => {
                    _.each(lines, (l) => {
                        var invoice = this.db.invoices_by_id[l.move_id];
                        if (!invoice) {
                            return;
                        }
                        invoice.lines = invoice.lines || [];
                        // Escape duplicates
                        if (
                            invoice.lines.every(
                                (existing_line) => existing_line.id !== l.id
                            )
                        ) {
                            invoice.lines.push(l);
                        }
                    });
                });
        },

        on_notification: function (notification) {
            var invoices_to_update = [];
            var sale_orders_to_update = [];
            var channel = notification.channel;
            var message = notification.id;
            if (channel === "pos_invoices") {
                invoices_to_update.push(message);
            }
            if (channel === "pos_sale_orders") {
                sale_orders_to_update.push(message);
            }
            if (invoices_to_update.length > 0) {
                this.update_invoices_from_poll(_.unique(invoices_to_update));
            }
            if (sale_orders_to_update.length > 0) {
                this.update_sale_orders_from_poll(_.unique(sale_orders_to_update));
            }
        },

        update_invoices_from_poll: function (ids) {
            var self = this;
            _.each(ids, function (id) {
                self.update_or_fetch_invoice(id).then(function () {
                    self.trigger("invoice-updated");
                });
            });
        },

        update_sale_orders_from_poll: function (ids) {
            var self = this;
            _.each(ids, function (id) {
                self.update_or_fetch_sale_order(id).then(function () {
                    self.trigger("sale-order-updated");
                });
            });
        },

        prepare_invoices_data: function (data) {
            _.each(data, function (item) {
                for (var property in item) {
                    if (Object.prototype.hasOwnProperty.call(item, property)) {
                        if (item[property] === false) {
                            item[property] = " ";
                        }
                    }
                }
            });
        },

        prepare_so_data: function (data) {
            _.each(data, function (item) {
                switch (item.invoice_status) {
                    case "to invoice":
                        item.invoice_status = "To invoice";
                        break;
                    case "no":
                        item.invoice_status = "Nothing to invoice";
                        break;
                }
            });
        },

        get_res: function (model_name, id) {
            var fields = _.find(this.models, function (model) {
                    return model.model === model_name;
                }).fields,
                domain = [["id", "=", id]];
            return rpc.query({
                model: model_name,
                method: "search_read",
                args: [domain, fields],
            });
        },

        update_or_fetch_invoice: function (id) {
            var self = this,
                def = $.Deferred();
            this.get_res("account.move", id).then(function (res) {
                self.prepare_invoices_data(res);
                self.db.update_invoice_db(res[0]);
                self.get_invoice_lines([res[0].id]).then(function () {
                    def.resolve(id);
                });
            });
            return def.promise();
        },

        update_or_fetch_sale_order: function (id) {
            var def = $.Deferred(),
                self = this;
            this.get_res("sale.order", id).then(function (res) {
                self.prepare_so_data(res);
                self.db.update_so_db(res[0]);
                self.get_sale_order_lines([res[0].id]).then(function () {
                    def.resolve(id);
                });
            });
            return def.promise();
        },

        validate_invoice: function (id) {
            return rpc.query({
                model: "account.move",
                method: "action_invoice_open",
                args: [id],
            });
        },

        get_invoices_to_render: function (invoices) {
            var muted_invoices_ids = [],
                order = {},
                id = 0,
                i = 0,
                client = this.get_client(),
                orders_to_mute = _.filter(this.db.get_orders(), function (mtd_order) {
                    return mtd_order.data.invoice_to_pay;
                });
            if (orders_to_mute) {
                for (i = 0; orders_to_mute.length > i; i++) {
                    order = orders_to_mute[i];
                    id = order.data.invoice_to_pay.id;
                    muted_invoices_ids.push(id);
                }
            }
            if (muted_invoices_ids && muted_invoices_ids.length) {
                invoices = _.filter(invoices, function (inv) {
                    return !_.contains(muted_invoices_ids, inv.id);
                });
            }
            if (client) {
                invoices = _.filter(invoices, function (inv) {
                    return inv.partner_id[0] === client.id;
                });
                return invoices;
            }
            invoices = _.filter(invoices, function (inv) {
                return (
                    inv.state === "posted" &&
                    _.contains(["not_paid", "partial"], inv.payment_state)
                );
            });
            return invoices;
        },

        get_sale_order_to_render: function (sale_orders) {
            var client = this.get_client();
            if (client) {
                sale_orders = _.filter(sale_orders, function (so) {
                    return so.partner_id[0] === client.id;
                });
                return sale_orders;
            }
            return sale_orders;
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        export_as_JSON: function () {
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.invoice_to_pay = this.invoice_to_pay;
            return data;
        },

        invoice_get_subtotal() {
            const tax = this.invoice_to_pay.amount_tax;
            const residual = this.invoice_to_pay.amount_residual;
            return round_pr(Math.max(0, residual - tax), this.pos.currency.rounding);
        },

        invoice_get_due() {
            const total = this.invoice_to_pay.amount_residual;
            const due = total - this.get_total_paid();
            return round_pr(Math.max(0, due), this.pos.currency.rounding);
        },

        invoice_get_change() {
            const change = this.get_total_paid() - this.invoice_to_pay.amount_residual;
            return round_pr(Math.max(0, change), this.pos.currency.rounding);
        },

        invoice_get_residual() {
            return round_pr(
                Math.max(0, this.invoice_to_pay.amount_residual),
                this.pos.currency.rounding
            );
        },

        invoice_export_for_printing() {
            const r = this.export_for_printing();
            r.change = this.invoice_get_change();
            r.subtotal = this.invoice_get_subtotal();
            r.name = "Payment of Invoice: " + this.invoice_to_pay.name;
            r.total_with_tax = this.invoice_to_pay.amount_residual;
            return r;
        },

        getInvoiceReceiptEnv() {
            const r = this.getOrderReceiptEnv();
            r.receipt = this.invoice_export_for_printing();
            return r;
        },
    });

    PosDb.include({
        init: function (options) {
            this._super(options);
            this.sale_orders = [];
            this.sale_orders_by_id = {};
            this.sale_orders_search_string = "";
            this.invoices = [];
            this.invoices_by_id = {};
            this.invoices_search_string = "";
        },

        add_sale_orders: function (sale_orders) {
            var self = this;
            _.each(sale_orders, function (order) {
                self.sale_orders.push(order);
                self.sale_orders_by_id[order.id] = order;
                self.sale_orders_search_string += self._sale_order_search_string(order);
            });
        },

        update_so_search_string: function (sale_orders) {
            var self = this;
            self.sale_orders_search_string = "";
            _.each(sale_orders, function (order) {
                self.sale_orders_search_string += self._sale_order_search_string(order);
            });
        },

        update_invoices_search_string: function (invoices) {
            var self = this;
            self.invoices_search_string = "";
            _.each(invoices, function (inv) {
                self.invoices_search_string += self._invoice_search_string(inv);
            });
        },

        _sale_order_search_string: function (sale_order) {
            var str = sale_order.name;
            if (sale_order.date_order) {
                str += "|" + sale_order.date_order;
            }
            if (sale_order.partner_id[1]) {
                str += "|" + sale_order.partner_id[1];
            }
            if (sale_order.user_id[1]) {
                str += "|" + sale_order.user_id[1];
            }
            if (sale_order.amount_total) {
                str += "|" + sale_order.amount_total;
            }

            str = String(sale_order.id) + ":" + str.replace(":", "") + "\n";
            return str;
        },

        search_sale_orders: function (query) {
            try {
                query = query.replace(
                    /[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g,
                    "."
                );
                query = query.replace(/ /g, ".+");
                var re = RegExp("([0-9]+):.*?" + query, "gi");
            } catch (e) {
                return [];
            }
            var results = [];
            for (var i = 0; i < this.limit; i++) {
                var r = re.exec(this.sale_orders_search_string);
                if (r) {
                    var id = Number(r[1]);
                    results.push(this.get_sale_order_by_id(id));
                } else {
                    break;
                }
            }
            return results.filter(function (res) {
                return typeof res === "object";
            });
        },

        get_sale_order_by_id: function (id) {
            return this.sale_orders_by_id[id];
        },

        update_so_db: function (updated_so) {
            for (var i = 0; i < this.sale_orders.length; i++) {
                if (this.sale_orders[i].id === updated_so.id) {
                    this.sale_orders.splice(i, 1);
                    break;
                }
            }
            delete this.sale_orders_by_id[updated_so.id];
            if (updated_so.invoice_status === "To invoice") {
                this.sale_orders.unshift(updated_so);
                this.sale_orders_by_id[updated_so.id] = updated_so;
            }
            this.update_so_search_string(this.sale_orders);
        },

        add_invoices: function (invoices) {
            var self = this;
            _.each(invoices, function (invoice) {
                self.invoices.push(invoice);
                self.invoices_by_id[invoice.id] = invoice;
                self.invoices_search_string += self._invoice_search_string(invoice);
            });
        },

        update_invoice_db: function (updated_invoice) {
            for (var i = 0; i < this.invoices.length; i++) {
                if (this.invoices[i].id === updated_invoice.id) {
                    this.invoices.splice(i, 1);
                    break;
                }
            }
            if (
                updated_invoice.state === "draft" ||
                updated_invoice.state === "posted"
            ) {
                this.invoices.unshift(updated_invoice);
                this.invoices_by_id[updated_invoice.id] = updated_invoice;
            } else {
                delete this.invoices_by_id[updated_invoice.id];
            }
            this.update_invoices_search_string(this.invoices);
        },

        _invoice_search_string: function (invoice) {
            var str = invoice.partner_id[1];
            if (invoice.name) {
                str += "|" + invoice.name;
            }
            if (invoice.invoice_date) {
                str += "|" + invoice.invoice_date;
            }
            if (invoice.invoice_date_due) {
                str += "|" + invoice.invoice_date_due;
            }
            if (invoice.invoice_user_id[1]) {
                str += "|" + invoice.invoice_user_id[1];
            }
            if (invoice.amount_total) {
                str += "|" + invoice.amount_total;
            }
            str = String(invoice.id) + ":" + str.replace(":", "") + "\n";
            return str;
        },

        search_invoices: function (query) {
            try {
                query = query.replace(
                    /[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g,
                    "."
                );
                query = query.replace(/ /g, ".+");
                var re = RegExp("([0-9]+):.*?" + query, "gi");
            } catch (e) {
                return [];
            }
            var results = [];
            for (var i = 0; i < this.limit; i++) {
                var r = re.exec(this.invoices_search_string);
                if (r) {
                    var id = Number(r[1]);
                    results.push(this.get_invoice_by_id(id));
                } else {
                    break;
                }
            }
            return results.filter(function (res) {
                return typeof res === "object";
            });
        },

        get_invoice_by_id: function (id) {
            return this.invoices_by_id[id];
        },
    });
});
