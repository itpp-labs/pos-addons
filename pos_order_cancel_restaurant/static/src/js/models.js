/* Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_order_cancel_restaurant.models", function(require) {
    "use strict";

    var models = require("pos_order_cancel.models");
    require("pos_restaurant_base.models");

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        add_cancelled_line: function(line) {
            if (this.pos.config.save_canceled_kitchen_orders_only) {
                var new_line = line.export_as_JSON();
                new_line.reason = false;
                if (this.is_cancelled) {
                    new_line.qty = line.max_quantity;
                    new_line.current_qty = 0;
                } else {
                    if (line.quantity >= 0) {
                        new_line.qty = line.max_quantity - line.quantity;
                    } else {
                        new_line.qty = line.max_quantity;
                    }
                    new_line.current_qty = line.quantity;
                    new_line.canceled_date = this.get_datetime();
                }
                new_line.cancelled_id = line.id;
                new_line.user_id = this.pos.get_cashier().id;
                new_line.user_name = this.pos.get_cashier().name;
                line.cancelled_line = new_line;
                if (new_line.was_printed) {
                    this.canceled_lines.push([0, 0, new_line]);
                }
            } else {
                _super_order.add_cancelled_line.apply(this, arguments);
            }
        },
        saveChanges: function() {
            _super_order.saveChanges.call(this, arguments);
            var lines = this.get_order_lines_by_dirty_status(false);
            lines.forEach(function(line) {
                line.was_printed = true;
            });
        },
        get_order_lines_by_dirty_status: function(mp_dirty_status) {
            var lines = this.get_orderlines();
            lines = lines.filter(function(line) {
                return line.mp_dirty === mp_dirty_status;
            });
            var printers = this.pos.printers;
            var categories_ids = [];
            for (var i = 0; i < printers.length; i++) {
                var product_categories_ids = printers[i].config.product_categories_ids;
                product_categories_ids.forEach(function(id) {
                    categories_ids.push(id);
                });
            }
            var unique_categories_ids = [];
            this.unique(categories_ids).forEach(function(id) {
                unique_categories_ids.push(Number(id));
            });
            var new_lines = [];
            unique_categories_ids.forEach(function(id) {
                lines.forEach(function(line) {
                    // For compatibility with pos_category_multi
                    if (
                        line.product.pos_category_ids &&
                        line.product.pos_category_ids.indexOf(id) !== -1
                    ) {
                        new_lines.push(line);
                    } else if (
                        line.product.pos_categ_id &&
                        line.product.pos_categ_id[0] === id
                    ) {
                        new_lines.push(line);
                    }
                });
            });
            if (new_lines.length === 0) {
                this.сancel_button_available = false;
            } else {
                this.сancel_button_available = true;
            }
            return new_lines;
        },
        unique: function(arr) {
            var obj = {};
            for (var i = 0; i < arr.length; i++) {
                var str = arr[i];
                obj[str] = true;
            }
            return Object.keys(obj);
        },
        computeChanges: function(categories) {
            var self = this;
            var res = _super_order.computeChanges.apply(this, arguments);
            if (res.cancelled && res.cancelled.length) {
                res.cancelled.forEach(function(product, index) {
                    var line = self.get_orderline(product.line_id);
                    if (
                        !self.pos.config.send_removed_lines_to_kitchen &&
                        product.qty === 0
                    ) {
                        res.cancelled.splice(index, 1);
                    } else if (
                        line &&
                        line.cancelled_line &&
                        line.cancelled_line.reason
                    ) {
                        product.reason = line.cancelled_line.reason;
                    }
                });
            }
            if (this.reason) {
                res.reason = this.reason;
            }
            return res;
        },
        destroy_and_upload_as_canceled: function(reason, cancelled_reason_ids) {
            _super_order.destroy_and_upload_as_canceled.apply(this, arguments);
            this.printChanges();
            this.saveChanges();
            if (!this.canceled_lines.length) {
                this.destroy({reason: "abandon"});
            }
            //  Read more about this trigger in pos_order_cancel module
            this.trigger("new_updates_to_send");
        },
        upload_order_as_canceled: function() {
            if (this.canceled_lines.length) {
                _super_order.upload_order_as_canceled.apply(this, arguments);
            }
        },
        change_cancelled_quantity: function(line) {
            if (this.pos.config.kitchen_canceled_only) {
                if (line.was_printed) {
                    _super_order.change_cancelled_quantity.apply(this, arguments);
                } else {
                    this.save_canceled_line(line);
                }
            } else {
                _super_order.change_cancelled_quantity.apply(this, arguments);
            }
        },
        get_order_floor: function() {
            if (this.table && this.table.floor) {
                return this.table.floor.name;
            }
            return false;
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr, options) {
            _super_orderline.initialize.apply(this, arguments);
            if (this.pos.config.save_canceled_kitchen_orders_only) {
                this.max_quantity = false;
            }
        },
        apply_ms_data: function(data) {
            if (_super_orderline.apply_ms_data) {
                _super_orderline.apply_ms_data.apply(this, arguments);
            }
            this.was_printed = data.was_printed;
        },
        cancel_quantity_changes: function() {
            _super_orderline.cancel_quantity_changes.apply(this, arguments);
            if (this.was_printed) {
                this.set_dirty(false);
                this.trigger("change", this);
            }
        },
        set_dirty: function(dirty) {
            if (this.mp_dirty !== dirty && dirty === false) {
                this.max_quantity = this.quantity;
            }
            _super_orderline.set_dirty.apply(this, arguments);
        },
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            data.was_printed = this.was_printed;
            return data;
        },
        init_from_JSON: function(json) {
            this.was_printed = json.was_printed;
            _super_orderline.init_from_JSON.call(this, json);
        },
    });
    return models;
});
