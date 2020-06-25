/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
   License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_wechat_miniprogram.models", function(require) {
    "use strict";

    var models = require("point_of_sale.models");
    var core = require("web.core");
    var _t = core._t;

    models.load_fields("account.journal", ["wechat"]);

    models.load_fields("product.product", ["available_pos_product_qty"]);

    // Load WeChat Mini-Program Orders
    models.load_models({
        model: "pos.miniprogram.order",
        fields: [],
        domain: function(self) {
            return [
                ["confirmed_from_pos", "=", false],
                ["company_id", "=", self.config.company_id[0]],
            ];
        },
        condition: function(self) {
            return self.config.allow_message_from_miniprogram;
        },
        loaded: function(self, orders) {
            // Mini-Program Orders
            self.miniprogram_orders = orders;
            self.miniprogram_orders_by_id = {};
            orders.forEach(function(order) {
                self.miniprogram_orders_by_id[order.id] = order;
            });
        },
    });

    // Load WeChat Mini-Program Order lines
    models.load_models({
        model: "pos.miniprogram.order.line",
        fields: [],
        domain: function(self) {
            return [
                ["confirmed_from_pos", "=", false],
                ["company_id", "=", self.config.company_id[0]],
            ];
        },
        condition: function(self) {
            return self.config.allow_message_from_miniprogram;
        },
        loaded: function(self, lines) {
            // Mini-Program Orderlines
            self.miniprogram_order_lines = lines;
            self.miniprogram_order_lines_by_id = {};
            lines.forEach(function(line) {
                self.miniprogram_order_lines_by_id[line.id] = line;
            });
        },
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function() {
            PosModelSuper.prototype.initialize.apply(this, arguments);
            // Add new channel to bus
            this.bus.add_channel_callback(
                "pos.wechat.miniprogram",
                this.on_wechat_miniprogram,
                this
            );
        },
        after_load_server_data: function() {
            var self = this;
            var res = PosModelSuper.prototype.after_load_server_data.apply(
                this,
                arguments
            );
            var done = new $.Deferred();

            $.when(res).then(function() {
                self.chrome.loading_skip();
                var progress = (self.models.length - 0.5) / self.models.length;
                self.chrome.loading_message(_t("Update Mini-Program Orders"), progress);
                var orders = self.miniprogram_orders;
                orders.forEach(function(order) {
                    order.lines_ids = self.miniprogram_order_lines.filter(function(
                        line
                    ) {
                        return line.order_id[0] === order.id;
                    });
                });
                self.on_wechat_miniprogram(orders);
                done.resolve();
            });
            return done;
        },
        on_wechat_miniprogram: function(message) {
            var self = this;
            if (Array.isArray(message)) {
                _.each(message, function(msg) {
                    self.do_miniprogram_order(msg);
                });
            } else {
                self.do_miniprogram_order(message);
            }
        },
        do_miniprogram_order: function(msg_info) {
            var exist_order = this.get("orders").find(function(o) {
                return o.miniprogram_order && o.miniprogram_order.id === msg_info.id;
            });
            if (exist_order) {
                // Update exist mini-program order
                this.update_miniprogram_order(exist_order, msg_info);
            } else {
                // Create new mini-program order
                this.create_miniprogram_order(msg_info);
            }
        },
        update_miniprogram_order: function(order, data) {
            var not_found = order.orderlines.map(function(r) {
                return r.miniprogram_line.id;
            });
            data.lines_ids.forEach(function(line_data) {
                var line = order.orderlines.find(function(r) {
                    // Search by mini-program orderline id
                    return line_data.id === r.miniprogram_line.id;
                });
                not_found = _.without(not_found, line_data.id);

                if (line) {
                    // Update orderline
                    line.apply_updates_miniprogram_line(line_data);
                } else {
                    // Create new line and add to the Order
                    order.create_miniprogram_line(line_data);
                }
            });
            // Remove old lines
            _.each(not_found, function(id) {
                var line = order.orderlines.find(function(r) {
                    return id === r.miniprogram_line.id;
                });
                order.orderlines.remove(line);
            });
            // Update exist order
            order.apply_updates_miniprogram_order(data);
        },
        create_miniprogram_order: function(data) {
            // Get current order
            var current_order = this.get_order();
            // Create new order
            var order = new models.Order({}, {mp_data: data, pos: this});
            // Get and set partner
            if (typeof data.partner_id === "undefined") {
                order.set_client(null);
            } else {
                var client = order.pos.db.get_partner_by_id(data.partner_id[0]);
                if (!client) {
                    $.when(this.load_new_partners_by_id(data.partner_id[0])).then(
                        function(new_client) {
                            new_client = order.pos.db.get_partner_by_id(
                                data.partner_id
                            );
                            order.set_client(new_client);
                        }
                    );
                }
                order.set_client(client);
            }
            this.get("orders").add(order);
            this.set("selectedOrder", current_order);
            data.lines_ids.forEach(function(line_data) {
                order.create_miniprogram_line(line_data);
            });

            // Update floor screen
            var floor_screen = this.gui.screen_instances.floors;
            if (floor_screen && this.gui.get_current_screen() === "floors") {
                floor_screen.renderElement();
            }
            // Auto print payed orders
            if (
                this.printers.length &&
                order.hasChangesToPrint() &&
                this.config.auto_print_miniprogram_orders &&
                order.miniprogram_order &&
                order.miniprogram_order.state === "done"
            ) {
                order.printChanges();
                order.saveChanges();
            }
        },
        get_mp_cashregister: function() {
            return this.cashregisters.find(function(c) {
                return c.journal.wechat && c.journal.wechat === "jsapi";
            });
        },
        ms_create_order: function(options) {
            // Ignore the function (for mini-program orders we have another callback function)
            // TODO: check it
            var data = options.data;
            var json = options.json;
            if (data && data.miniprogram_order && data.miniprogram_order.id) {
                return false;
            }
            if (json && json.miniprogram_order && json.miniprogram_order.id) {
                return false;
            }
            return PosModelSuper.prototype.ms_create_order.apply(this, arguments);
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        initialize: function(attributes, options) {
            options = options || {};
            this.miniprogram_order = {};
            OrderSuper.prototype.initialize.apply(this, arguments);
            if (options.mp_data) {
                this.apply_updates_miniprogram_order(options.mp_data);
            }
        },
        add_product: function(product, options) {
            var available_pos_product_qty = this.pos.db.get_product_by_id(product.id)
                .available_pos_product_qty;
            if (available_pos_product_qty <= 0) {
                return this.gui.show_popup("error", {
                    title: _t("No Product"),
                    body: _t("You cannot add the product."),
                });
            }
            OrderSuper.prototype.add_product.apply(this, arguments);
        },
        apply_updates_miniprogram_order: function(data) {
            // All mini-program data
            this.miniprogram_order = data;

            // Common data between POS Order and Order of mini-program
            this.table = this.pos.tables_by_id[data.table_id[0]];
            this.floor = this.pos.floors_by_id[data.floor_id[0]] || null;
            this.customer_count = data.customer_count || 1;
            this.note = data.note;
            this.to_invoice = data.to_invoice;

            // Save to db
            this.trigger("change", this);
        },
        create_miniprogram_line: function(data) {
            var product = this.pos.db.get_product_by_id(data.product_id[0]);
            if (product) {
                var line = new models.Orderline(
                    {},
                    {pos: this.pos, order: this, product: product, mp_data: data}
                );
                if (
                    typeof data.quantity !== "undefined" &&
                    data.quantity !== line.quantity
                ) {
                    line.set_quantity(data.quantity);
                }
                if (typeof data.price !== "undefined" && data.price !== line.price) {
                    line.set_unit_price(data.price);
                }
                if (data.note) {
                    line.set_note(data.note);
                }
                this.orderlines.add(line);
                return line;
            }
            return false;
        },
        export_as_JSON: function() {
            var data = OrderSuper.prototype.export_as_JSON.apply(this, arguments);
            data.miniprogram_order = this.miniprogram_order;
            data.miniprogram_order_ref = this.uid;
            return data;
        },
        init_from_JSON: function(json) {
            this.miniprogram_order = json.miniprogram_order;
            OrderSuper.prototype.init_from_JSON.call(this, json);
        },
    });

    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr, options) {
            options = options || {};
            this.miniprogram_line = {};
            OrderlineSuper.prototype.initialize.apply(this, arguments);
            if (options.mp_data) {
                this.apply_updates_miniprogram_line(options.mp_data);
            }
        },
        apply_updates_miniprogram_line: function(data) {
            // All mini-program data
            this.miniprogram_line = data;

            // Common data for the orderline and for the line of mini-program
            if (this.quantity !== data.quantity) {
                this.set_quantity(data.quantity);
            }
            if (this.price !== data.price) {
                this.set_unit_price(data.price);
            }
            if (data.note) {
                this.set_note(data.note);
            }
            // Save to db
            this.trigger("change", this);
            this.order.trigger("change", this);
        },
        export_as_JSON: function() {
            var data = OrderlineSuper.prototype.export_as_JSON.apply(this, arguments);
            data.miniprogram_line = this.miniprogram_line;
            return data;
        },
        init_from_JSON: function(json) {
            this.miniprogram_line = json.miniprogram_line;
            OrderlineSuper.prototype.init_from_JSON.call(this, json);
        },
    });
});
