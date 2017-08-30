odoo.define('pos_order_cancel.models', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var Model = require('web.DataModel');
    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;

    models.load_models({
        model: 'pos.cancelled_reason',
        fields: ['name', 'sequence'],
        loaded: function(self,cancelled_reason){
            var sorting_cancelled_reason = function(idOne, idTwo){
                return idOne.sequence - idTwo.sequence;
            };
            if (cancelled_reason) {
                self.cancelled_reason = cancelled_reason.sort(sorting_cancelled_reason);
            }
        },
    });

    var NumpadSuper = models.NumpadState;
    models.NumpadState = models.NumpadState.extend({
        deleteLastChar: function() {
            if(this.get('buffer') === "" && this.get('mode') === 'quantity'){
                this.trigger('show_popup', 'product');
                if (!this.show_popup) {
                    NumpadSuper.prototype.deleteLastChar.apply(this, arguments);
                }
            } else {
                NumpadSuper.prototype.deleteLastChar.apply(this, arguments);
            }
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function(attributes, options){
            var res = _super_order.initialize.apply(this, arguments);
            this.canceled_lines = [];
            this.contains_canceled_lines = false;
            return res;
        },
        save_canceled_order: function(reason) {
            var self = this;
            this.is_cancelled = true;
            this.reason = reason;
            this.orderlines.each(function(orderline){
                self.save_canceled_line(_t("Order Deleting"), self.get_last_orderline());
                self.remove_orderline(self.get_last_orderline());
            });
            this.pos.push_order(this).then(function() {
                self.destroy({'reason':'abandon'});
            });
        },
        select_orderline: function(line){
            var old_line = this.selected_orderline;
            if(line && line !== old_line){
                if (old_line && old_line.old_quantity > old_line.quantity) {
                    this.pos.gui.screen_instances.products.order_widget.show_popup('product', old_line);
                }
            }
            _super_order.select_orderline.apply(this, arguments);
        },
        save_canceled_line: function(reason, orderline) {
            var self = this;
            var line = orderline.export_as_JSON();
            line.reason = reason;
            var quantity = orderline.quantity;
            if (!this.is_cancelled) {
                if (orderline.quantity < orderline.old_quantity) {
                    quantity = orderline.old_quantity - orderline.quantity;
                }
                line.canceled_date = this.get_datetime();
            } else if (orderline && orderline.old_quantity) {
                quantity = orderline.old_quantity;
            }
            line.qty = quantity;
            orderline.old_quantity = orderline.quantity;
            line.user_id = this.pos.cashier
                           ? this.pos.cashier.id
                           : this.pos.user.id;
            this.contains_canceled_lines = true;
            this.canceled_lines.push([0, 0, line]);
            if (orderline.remove_with_numpad) {
                self.remove_orderline(orderline);
            }
        },
        get_datetime: function() {
            var currentdate = new Date();
            var datetime = currentdate.getDate() + "/" +
                           (currentdate.getMonth()+1) + "/" +
                           currentdate.getFullYear() + " " +
                           currentdate.getHours() + ":" +
                           currentdate.getMinutes() + ":" +
                           currentdate.getSeconds();
            return datetime;
        },
        export_as_JSON: function() {
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.canceled_lines = this.canceled_lines;
            data.reason = this.reason;
            data.is_cancelled = this.is_cancelled;
            data.contains_canceled_lines = this.contains_canceled_lines;
            return data;
        },
        init_from_JSON: function(json) {
            this.canceled_lines = json.canceled_lines;
            this.reason = json.reason;
            this.is_cancelled = json.is_cancelled;
            this.contains_canceled_lines = json.contains_canceled_lines;
            _super_order.init_from_JSON.call(this, json);
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        set_quantity: function(quantity) {
            this.old_quantity = this.quantity;
            _super_orderline.set_quantity.apply(this,arguments);
        },
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            data.old_quantity = this.old_quantity;
            return data;
        },
        init_from_JSON: function(json) {
            this.old_quantity = json.old_quantity;
            _super_orderline.init_from_JSON.call(this, json);
        },
    });
    return models;
});
