odoo.define('pos_order_cancel_restaurant.models', function (require) {
    "use strict";

    var models = require('pos_order_cancel.models');
    var Model = require('web.DataModel');
    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;


    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        get_printed_order_lines: function(mp_dirty_status) {
            return this.get_orderlines().filter(function(line){
                return line.mp_dirty === mp_dirty_status;
            });
        },
//        initialize: function(attributes, options){
//            var res = _super_order.initialize.apply(this, arguments);
//            this.canceled_lines = [];
//            this.contains_canceled_lines = false;
//            return res;
//        },
//        save_canceled_order: function(reason) {
//            var self = this;
//            this.is_cancelled = true;
//            this.reason = reason;
//            this.orderlines.each(function(orderline){
//                self.get_last_orderline().save_canceled_line(_t("Order Deleting"));
//            });
//            this.pos.push_order(this).then(function() {
//                self.destroy({'reason':'abandon'});
//            });
//        },
//        export_as_JSON: function() {
//            var data = _super_order.export_as_JSON.apply(this, arguments);
//            data.canceled_lines = this.canceled_lines;
//            data.reason = this.reason;
//            data.is_cancelled = this.is_cancelled;
//            data.contains_canceled_lines = this.contains_canceled_lines;
//            return data;
//        },
//        init_from_JSON: function(json) {
//            this.canceled_lines = json.canceled_lines;
//            this.reason = json.reason;
//            this.is_cancelled = json.is_cancelled;
//            this.contains_canceled_lines = json.contains_canceled_lines;
//            _super_order.init_from_JSON.call(this, json);
//        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
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

//    var _super_orderline = models.Orderline.prototype;
//    models.Orderline = models.Orderline.extend({
//        save_canceled_line:!!!! function(reason) {
//            var self = this;
//            var line = this.export_as_JSON();
//            line.reason = reason;
//            line.user_id = this.pos.cashier ? this.pos.cashier.id : this.pos.user.id;
//            line.canceled_date = this.get_datetime();
//            this.order.contains_canceled_lines = true;
//            this.order.canceled_lines.push([0, 0, line]);
//            this.order.remove_orderline(this);
//        },
//        get_datetime: function() {
//            var currentdate = new Date();
//            var datetime = currentdate.getDate() + "/"
//                           + (currentdate.getMonth()+1)  + "/"
//                           + currentdate.getFullYear() + " "
//                           + currentdate.getHours() + ":"
//                           + currentdate.getMinutes() + ":"
//                           + currentdate.getSeconds();
//            return datetime;
//        },
//    });
    return models;
});
