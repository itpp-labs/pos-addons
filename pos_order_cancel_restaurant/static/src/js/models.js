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
        saveChanges: function(){
            _super_order.saveChanges.call(this, arguments);
            var lines = this.get_order_lines_by_dirty_status(false);
            lines.forEach(function(line){
                line.was_printed = true;
            });
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
            var self = this;
            var res = _super_order.computeChanges.apply(this, arguments);
            if (res.cancelled && res.cancelled.length) {
                res.cancelled.forEach(function(product) {
                    var line = self.get_orderline(product.line_id);
                    if (line && line.cancelled_line && line.cancelled_line.reason) {
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
            //  Read more about this trigger in pos_order_cancel module
            this.trigger('change:sync');
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
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
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
            }
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
