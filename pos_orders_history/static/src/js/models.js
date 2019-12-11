/* Copyright 2017-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Artem Losev
 * Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_orders_history.models', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');

    var _super_pos_model = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function () {
            _super_pos_model.initialize.apply(this, arguments);
            var self = this;
            this.ready.then(function () {
                self.bus.add_channel_callback("pos_orders_history", self.on_orders_history_updates, self);
            });
            this.subscribers = [];
        },
        add_subscriber: function (subscriber) {
            this.subscribers.push(subscriber);
        },
        on_orders_history_updates: function(message) {
            var self = this;
            // state of orders
            var state = ['paid'];
            if (this.config.show_cancelled_orders) {
                state.push('cancel');
            }
            if (this.config.show_posted_orders) {
                state.push('done');
            }
            message.updated_orders.forEach(function (id) {
                self.get_order_history(id).then(function(order) {
                    if (order instanceof Array) {
                        order = order[0];
                    }
                    if (state.indexOf(order.state) !== -1) {
                        self.update_orders_history(order);
                    }
                });
                self.get_order_history_lines_by_order_id(id).then(function (lines) {
                    self.update_orders_history_lines(lines);
                });
            });
        },
        get_order_history: function (id) {
            return rpc.query({
                model: 'pos.order',
                method: 'search_read',
                args: [[['id', '=', id]]]
            });
        },
        get_order_history_lines_by_order_id: function (id) {
            return rpc.query({
                model: 'pos.order.line',
                method: 'search_read',
                args: [[['order_id', '=', id]]]
            });
        },
        update_orders_history: function (orders) {
            var self = this,
                orders_to_update = [];
            if (!(orders instanceof Array)) {
                orders = [orders];
            }
            if (this.db.pos_orders_history.length !== 0) {
                _.each(orders, function (updated_order) {
                    var max = self.db.pos_orders_history.length;
                    for (var i = 0; i < max; i++) {
                        if (updated_order.id === self.db.pos_orders_history[i].id) {
                            self.db.pos_orders_history.splice(i, 1);
                            delete self.db.orders_history_by_id[updated_order.id];
                            orders_to_update.push(updated_order.id);
                            break;
                        }
                    }
                });
            }

            var all_orders = this.db.pos_orders_history.concat(orders);
            this.db.pos_orders_history = all_orders;
            this.db.sorted_orders_history(all_orders);
            all_orders.forEach(function (current_order) {
                self.db.orders_history_by_id[current_order.id] = current_order;
            });
            this.publish_db_updates(orders_to_update);
        },
        publish_db_updates: function (ids) {
            _.each(this.subscribers, function (subscriber) {
                var callback = subscriber.callback,
                    context = subscriber.context;
                callback.call(context, 'update', ids);
            });
        },
        update_orders_history_lines: function(lines) {
            var self = this;
            var all_lines = this.db.pos_orders_history_lines.concat(lines);
            this.db.pos_orders_history_lines = all_lines;
            all_lines.forEach(function (line) {
                self.db.line_by_id[line.id] = line;
            });
        },
        get_date: function() {
            var currentdate = new Date();
            var year = currentdate.getFullYear();
            var month = (currentdate.getMonth()+1);
            var day = currentdate.getDate();
            if (Math.floor(month / 10) === 0) {
                month = '0' + month;
            }
            if (Math.floor(day / 10) === 0) {
                day = '0' + day;
            }
            return year + "-" + month + "-" + day;
        },
    });

    var _super_order_model = models.Order.prototype;
    models.Order = models.Order.extend({
        set_mode: function(mode) {
            this.mode = mode;
        },
        get_mode: function() {
            return this.mode;
        },
        export_as_JSON: function() {
            var data = _super_order_model.export_as_JSON.apply(this, arguments);
            data.mode = this.mode;
            return data;
        },
        init_from_JSON: function(json) {
            this.mode = json.mode;
            _super_order_model.init_from_JSON.call(this, json);
        }
    });

    models.load_models({
        model: 'pos.order',
        fields: [],
        domain: function(self) {
            var domain = [];

            // state of orders
            var state = ['paid'];
            if (self.config.show_cancelled_orders) {
                state.push('cancel');
            }
            if (self.config.show_posted_orders) {
                state.push('done');
            }

            domain.push(['state','in',state]);

            // number of orders
            if (self.config.load_orders_of_last_n_days) {
                var today = new Date();
                today.setHours(0,0,0,0);
                // load orders from the last date
                var last_date = new Date(today.setDate(today.getDate()-self.config.number_of_days)).toISOString();
                domain.push(['date_order','>=',last_date]);
            }

            return domain;
        },
        condition: function(self) {
            return self.config.orders_history && !self.config.load_barcode_order_only;
        },
        loaded: function (self, orders) {
            self.update_orders_history(orders);
            self.order_ids = _.pluck(orders, 'id');
        },
    });

    models.load_models({
        model: 'pos.order.line',
        fields: [],
        domain: function(self) {
            return [['order_id', 'in', self.order_ids]];
        },
        condition: function(self) {
            return self.config.orders_history && !self.config.load_barcode_order_only;
        },
        loaded: function (self, lines) {
            self.update_orders_history_lines(lines);
        },
    });

    return models;
});
