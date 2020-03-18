/* Copyright 2015-2016,2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
 * Copyright 2015-2016 Ilyas Rakhimkulov
 * Copyright 2016-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2017,2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * Copyright 2017 Attila Szöllősi
 * Copyright 2017 Thomas Paul
 * License MIT (https://opensource.org/licenses/MIT). */

odoo.define("pos_multi_session_restaurant", function(require) {
    "use strict";
    var screens = require("pos_restaurant_base.screens");
    var models = require("pos_restaurant_base.models");
    require("pos_restaurant.multiprint");
    var floors = require("pos_restaurant.floors");
    var core = require("web.core");
    var gui = require("point_of_sale.gui");
    require("pos_multi_session");
    var Model = require("web.Model");

    var _t = core._t;

    gui.Gui.prototype.screen_classes
        .filter(function(el) {
            return el.name === "splitbill";
        })[0]
        .widget.include({
            pay: function(order, neworder, splitlines) {
                this._super(order, neworder, splitlines);
                neworder.save_to_db();
            },
        });

    screens.OrderWidget.include({
        update_summary: function() {
            var order = this.pos.get("selectedOrder");
            if (!order) {
                return;
            }
            this._super();
        },
        remove_orderline: function(order_line) {
            if (
                this.pos.get_order() &&
                this.pos.get_order().get_orderlines().length === 0
            ) {
                this._super(order_line);
            } else if (order_line.node && order_line.node.parentNode) {
                order_line.node.parentNode.removeChild(order_line.node);
            }
        },
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function() {
            var ms_model = {
                model: "pos.multi_session",
                fields: ["name", "floor_ids"],
                domain: null,
                loaded: function(self, floor_set) {
                    self.multi_session_floors = floor_set;
                },
            };
            this.models.splice(
                1 +
                    this.models.indexOf(
                        _.find(this.models, function(model) {
                            return model.model === "pos.config";
                        })
                    ),
                0,
                ms_model
            );
            var floor_model = _.find(this.models, function(model) {
                return model.model === "restaurant.floor";
            });
            floor_model.domain = function(self) {
                var temporary = [["id", "in", self.config.floor_ids]];
                if (self.config.multi_session_id) {
                    var ms_floors = _.find(self.multi_session_floors, function(
                        session
                    ) {
                        return session.id === self.config.multi_session_id[0];
                    });
                    temporary = [["id", "in", ms_floors.floor_ids]];
                }
                return temporary;
            };
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.ready.then(function() {
                if (!self.multi_session_active) {
                    return;
                }
                self.multi_session.floor_ids = self.multi_session_floors.floor_ids;
                self.config.floor_ids = self.multi_session.floor_ids;
            });
        },
        add_new_order: function() {
            PosModelSuper.prototype.add_new_order.apply(this, arguments);
            var current_order = this.get_order();
            if (this.multi_session && current_order) {
                current_order.new_updates_to_send();
                current_order.save_to_db();
            }
        },
        ms_create_order: function(options) {
            var self = this;
            var data = options.json;
            var table = false;
            var floor_table = false;
            var order = false;

            // Multi session without floors
            if (!this.config.ms_floor_ids.length) {
                return PosModelSuper.prototype.ms_create_order.call(this, options);
            }

            if (data.table_id) {
                table = this.tables_by_id[data.table_id];
            }

            // Is there a table on the floor?
            if (table) {
                floor_table = _.find(table.floor.tables, function(t) {
                    return t.id === data.table_id;
                });
            }

            if (
                table &&
                data.removed_table_id &&
                this.tables_by_id[data.removed_table_id]
            ) {
                var removed_table = this.tables_by_id[data.removed_table_id];
                this.gui.show_popup("error", {
                    title: _t("Got unknown table " + removed_table.name),
                    body: _t("Order will be moved to " + table.name + " table"),
                });

                // Remove old table from floor screen
                var floor = this.floors.find(function(f) {
                    return f.id === removed_table.floor_id[0];
                });
                var index = floor.tables.findIndex(function(t) {
                    return t.id === removed_table.id;
                });
                floor.tables.splice(index, 1);
                delete this.tables_by_id[data.removed_table_id];

                if (
                    this.gui.screen_instances.floors &&
                    this.gui.get_current_screen() === "floors"
                ) {
                    this.gui.screen_instances.floors.renderElement();
                }
            }

            if (table && floor_table) {
                order = PosModelSuper.prototype.ms_create_order.call(this, options);
                order.table = self.tables_by_id[data.table_id];
                order.customer_count = data.customer_count;
                order.removed_table_id = false;
            } else {
                // Load new table
                new Model("restaurant.table")
                    .call("search_read", [[["id", "=", data.table_id]]])
                    .then(function(t) {
                        if (t.length) {
                            self.gui.show_popup("confirm", {
                                title: _t("Got a new table"),
                                body: _t(
                                    "Do you want to reload this page to receive the latest updates?"
                                ),
                                confirm: function() {
                                    location.reload();
                                },
                            });
                        } else {
                            // If the table is not exist move the order to a first empty table
                            var empty_tables = self.floors[0].tables.filter(function(
                                exist_table
                            ) {
                                return self.get_table_orders(exist_table).length === 0;
                            });
                            var transfer_table =
                                self.tables_by_id[self.floors[0].table_ids[0]];
                            if (empty_tables.length) {
                                transfer_table = empty_tables[0];
                            }

                            var removed_table_id = data.table_id;
                            options.json.table_id = transfer_table.id;
                            order = self.ms_create_order(options);
                            order.removed_table_id = removed_table_id;
                            order.trigger("new_updates_to_send");
                            if (
                                self.gui.screen_instances.floors &&
                                self.gui.get_current_screen() === "floors"
                            ) {
                                self.gui.screen_instances.floors.renderElement();
                            }
                        }
                    });
            }
            return order;
        },
        updates_from_server: function(message) {
            var data = message.data || {};
            var order = false;
            var old_order = this.get_order();

            if (data.uid) {
                order = this.get("orders").find(function(ord) {
                    return ord.uid === data.uid;
                });
            }
            PosModelSuper.prototype.updates_from_server.apply(this, arguments);
            if (
                (order && old_order && old_order.uid !== order.uid) ||
                old_order === null
            ) {
                this.set("selectedOrder", old_order);
            }
            if (
                this.gui.screen_instances.floors &&
                this.gui.get_current_screen() === "floors"
            ) {
                this.gui.screen_instances.floors.renderElement();
            }
        },
        ms_update_order: function(order, data) {
            PosModelSuper.prototype.ms_update_order.apply(this, arguments);
            if (order) {
                order.init_locked = true;
                order.set_customer_count(data.customer_count, true);
                order.saved_resume = data.multiprint_resume;
                order.trigger("change");
                order.init_locked = false;
            }
        },
        ms_update_existing_order: function(order, data) {
            if (order.table && order.table.id !== data.table_id) {
                // The order has been transferred to another table
                this.order_to_transfer_to_different_table = order;
                this.set_table(this.tables_by_id[data.table_id]);
                this.order_to_transfer_to_different_table = null;
            }
            PosModelSuper.prototype.ms_update_existing_order.apply(this, arguments);
        },
        // Changes the current table.
        set_table: function(table) {
            var order = this.order_to_transfer_to_different_table;
            if (table && order) {
                var old_table = order.table;
                order.table = table;
                order.new_updates_to_send();
                order.table = old_table;
            }
            PosModelSuper.prototype.set_table.apply(this, arguments);
        },

        check_table_inaccessibility: function(table) {
            // Allows to open if you are the one who created there an order or if you POS responsible person
            if (!this.config.table_blocking) {
                return false;
            }
            var cashier = this.cashier;
            var user_is_manager = _.contains(
                cashier.groups_id,
                this.config.group_pos_manager_id[0]
            );
            if (user_is_manager) {
                return false;
            }
            var table_orders = this.get_table_orders(table);
            var creators = _.chain(table_orders)
                .map(function(o) {
                    return o.ms_info.created.user;
                })
                .unique()
                .value();
            var creator_ids = _.pluck(creators, "id");
            if (
                !creator_ids.length ||
                (creator_ids.length && _.contains(creator_ids, cashier.id))
            ) {
                return false;
            }
            return creators;
        },
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        set_customer_count: function(count, skip_ms_update) {
            OrderSuper.prototype.set_customer_count.apply(this, arguments);
            if (!skip_ms_update) {
                this.new_updates_to_send();
            }
        },
        order_removing_to_send: function() {
            if (this.transfer) {
                return;
            }
            return OrderSuper.prototype.order_removing_to_send.call(this, arguments);
        },
        saveChanges: function() {
            OrderSuper.prototype.saveChanges.apply(this, arguments);
            this.trigger("new_updates_to_send");
        },
        export_as_JSON: function() {
            var data = OrderSuper.prototype.export_as_JSON.apply(this, arguments);
            data.removed_table_id = this.removed_table_id;
            return data;
        },
    });

    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        get_line_diff_hash: function() {
            var res = OrderlineSuper.prototype.get_line_diff_hash.apply(
                this,
                arguments
            );
            res = res.split("|");
            res[0] = this.uid;
            res = res.join("|");
            return res;
        },
        /*  There is no need to check the presence of super method.
            Because pos_multi_session_restaurant is loaded later than pos_multi_session.
        */
        apply_ms_data: function(data) {
            if (typeof data.mp_dirty !== "undefined") {
                this.set_dirty(data.mp_dirty);
            }
            if (typeof data.mp_skip !== "undefined") {
                this.set_skip(data.mp_skip);
            }
            if (typeof data.note !== "undefined") {
                this.set_note(data.note);
            }
            OrderlineSuper.prototype.apply_ms_data.apply(this, arguments);
        },
    });

    floors.FloorScreenWidget.include({
        init: function(parent, options) {
            this._super(parent, options);
            this.saved_data = false;
        },
        show: function() {
            if (this.pos.debug) {
                console.log("renderElement of TableWidget");
            }
            this._super();
        },
        renderElement: function() {
            if (this.compare_data()) {
                return false;
            }
            if (this.pos.debug) {
                console.log("renderElement of FloorScreenWidget and TableWidget");
            }
            this._super();
            this.save_changes_data();
        },
        save_changes_data: function() {
            var collection = this.get_current_data();
            this.saved_data = JSON.stringify(collection);
        },
        compare_data: function() {
            var collection = this.get_current_data();
            return this.saved_data === JSON.stringify(collection);
        },
        tool_trash_table: function() {
            var self = this;
            if (this.selected_table) {
                if (this.pos.get_table_orders(this.selected_table.table).length) {
                    this.gui.show_popup("error", {
                        title: _t("You can not remove the table"),
                        body: _t(
                            "Please, complete your orders before deleting the table."
                        ),
                    });
                } else if (this.floor.tables.length === 1) {
                    this.gui.show_popup("error", {
                        title: _t("You can not remove the table"),
                        body: _t("Forbidden to remove the last table on the floor."),
                    });
                } else {
                    this.gui.show_popup("confirm", {
                        title: _t("Are you sure ?"),
                        comment: _t("Removing a table cannot be undone"),
                        body: _t("The table can be used in other POS"),
                        confirm: function() {
                            self.selected_table.trash();
                            delete self.pos.tables_by_id[self.selected_table.table.id];
                        },
                    });
                }
            }
        },
        get_current_data: function() {
            var self = this;
            var tables = this.floor.tables;

            var collection = [];
            tables.forEach(function(table) {
                collection.push({
                    floor: {
                        background_color: table.floor.background_color,
                        name: table.floor.name,
                        sequence: table.floor.sequence,
                    },
                    name: table.name,
                    height: table.height,
                    position_h: table.position_h,
                    position_v: table.position_v,
                    seats: table.seats,
                    shape: table.shape,
                    width: table.width,
                    order_count: self.pos.get_table_orders(table).length,
                    customer_count: self.pos.get_customer_count(table),
                    fill: Math.min(
                        1,
                        Math.max(0, self.pos.get_customer_count(table) / table.seats)
                    ),
                    notifications: self.get_notifications(table),
                });
            });
            return collection;
        },
        get_notifications: function(table) {
            var orders = this.pos.get_table_orders(table);
            var notifications = {};
            for (var i = 0; i < orders.length; i++) {
                if (orders[i].hasChangesToPrint()) {
                    notifications.printing = true;
                    break;
                } else if (orders[i].hasSkippedChanges()) {
                    notifications.skipped = true;
                }
            }
            return notifications;
        },
    });

    floors.TableWidget.include({
        click_handler: function() {
            var floorplan = this.getParent();
            if (floorplan.editing) {
                this._super();
            } else {
                var table = this.table;
                if (!table) {
                    return this._super();
                }
                var table_waiters = this.pos.check_table_inaccessibility(table);
                if (!table_waiters || !table_waiters.length) {
                    return this._super();
                }
                return this.pos.gui.show_popup("alert", {
                    title: _t("Can not open the Table"),
                    body: _t(
                        "The Table is served by another waiter " +
                            _.pluck(table_waiters, "name")
                    ),
                });
            }
        },
    });
});
