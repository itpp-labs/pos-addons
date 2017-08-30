odoo.define('pos_order_cancel_restaurant.models', function (require) {
    "use strict";

    var models = require('pos_order_cancel.models');
    var multiprint = require('pos_restaurant_base.models');
    var Model = require('web.DataModel');
    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;


    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        select_orderline: function(line){
            var old_line = this.selected_orderline;
            if(line && line !== old_line && this.pos.config.kitchen_canceled_only &&
                old_line && old_line.old_quantity > old_line.quantity) {
                old_line.was_change_quantity = true;
                this.save_canceled_line(_t("Change quantity"), old_line);
                if(line !== this.selected_orderline){
                    if(this.selected_orderline){
                        this.selected_orderline.set_selected(false);
                    }
                    this.selected_orderline = line;
                    this.selected_orderline.set_selected(true);
                    }
            } else {
                _super_order.select_orderline.apply(this, arguments);
            }
        },
        saveChanges: function(){
            var self = this;
            if (this.pos.config.kitchen_canceled_only) {
                if (this.was_removed_product) {
                    var not_printed_lines = this.get_order_lines_by_dirty_status(true);
                    this.trigger('change',this);
                    this.saved_resume = this.build_line_resume();
                    not_printed_lines.forEach(function (item) {
                        delete self.saved_resume[item.id];
                    });
                    this.trigger('change',this);
                    this.was_removed_product = false;
                } else {
                    _super_order.saveChanges.call(this, arguments);
                }
                var lines = this.get_order_lines_by_dirty_status(false);
                lines.forEach(function(line){
                    line.was_printed = true;
                });
            } else {
                _super_order.saveChanges.call(this, arguments);
            }
        },
        get_order_lines_by_dirty_status: function(mp_dirty_status) {
            var lines = this.get_orderlines();
            lines = lines.filter(function(line){
                return line.mp_dirty === mp_dirty_status;
            });
            var printers = this.pos.printers;
            var categories_ids = [];
            for(var i = 0; i < printers.length; i++) {
                var product_categories_ids = printers[i].config.product_categories_ids;
                product_categories_ids.forEach(function(id){
                    categories_ids.push(id);
                });
            }
            var unique_categories_ids = [];
            this.unique(categories_ids).forEach(function(id){
                unique_categories_ids.push(Number(id));
            });
            var new_lines = [];
            unique_categories_ids.forEach(function(id){
                lines.forEach(function(line){
                    if (line.product.pos_categ_id[0] === id) {
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
        unique: function(arr){
            var obj = {};
            for (var i = 0; i < arr.length; i++) {
                var str = arr[i];
                obj[str] = true;
            }
            return Object.keys(obj);
        },
        computeChanges: function(categories){
            var res = _super_order.computeChanges.apply(this, arguments);
            if (this.pos.config.kitchen_canceled_only) {
                if (this.was_removed_product) {
                    res.new = [];
                }
                if (this.reason) {
                    res.reason = this.reason;
                }
            }
            return res;
        },
        save_canceled_order: function(reason) {
            var self = this;
            if (this.pos.config.kitchen_canceled_only) {
                this.is_cancelled = true;
                this.reason = reason;
                this.orderlines.each(function(orderline){
                    self.save_canceled_line(_t("Order Deleting"), self.get_last_orderline());
                    self.remove_orderline(self.get_last_orderline());
                });
                this.printChanges();
                this.saveChanges();
                this.pos.push_order(this).then(function() {
                    self.destroy({'reason':'abandon'});
                });
            } else {
                _super_order.save_canceled_order.apply(this, arguments);
            }
        },
        save_canceled_line: function(reason, orderline) {
            if (this.pos.config.kitchen_canceled_only && !this.is_cancelled && orderline.was_printed) {
                this.was_removed_product = true;
                this.reason = reason;
                this.printChanges();
                if (orderline.was_change_quantity) {
                    this.was_removed_product = false;
                    orderline.was_change_quantity = false;
                }
                this.saveChanges();
            }
            _super_order.save_canceled_line.apply(this, arguments);
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            data.was_printed = this.was_printed;
            data.was_change_quantity = this.was_change_quantity;
            return data;
        },
        init_from_JSON: function(json) {
            this.was_printed = json.was_printed;
            this.was_change_quantity = json.was_change_quantity;
            _super_orderline.init_from_JSON.call(this, json);
        },
    });
    return models;
});
