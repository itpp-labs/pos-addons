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

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function(attributes, options){
            var res = _super_order.initialize.apply(this, arguments);
            this.canceled_lines = [];
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
        save_canceled_line: function(reason, orderline) {
            var self = this;
            var line = orderline.export_as_JSON();
            line.reason = reason;
            var quantity = orderline.quantity;
            if (!this.is_cancelled) {
                quantity = orderline.max_quantity - orderline.quantity;
                line.canceled_date = this.get_datetime();
            } else if (orderline && orderline.max_quantity) {
                quantity = orderline.max_quantity;
            }
            line.qty = quantity;
            line.cancelled_id = orderline.id;
            line.user_id = this.pos.cashier
                           ? this.pos.cashier.id
                           : this.pos.user.id;
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
        change_cancelled_quantity: function(line) {
            var exist_cancelled_line = this.canceled_lines.find(function(exist_line) {
                return line.id === exist_line[2].cancelled_id;
            });
            if (exist_cancelled_line) {
                exist_cancelled_line[2].qty = line.max_quantity - line.quantity;
            } else {
                if (this.pos.gui && this.pos.gui.screen_instances.products) {
                    this.pos.gui.screen_instances.products.order_widget.show_popup('product', line);
                }
            }
        },
        change_canceled_lines: function(line) {
            var exist_cancelled_line = this.canceled_lines.find(function(exist_line) {
                return line.id === exist_line[2].cancelled_id;
            });
            if (exist_cancelled_line) {
                var index = this.canceled_lines.indexOf(exist_cancelled_line);
                this.canceled_lines.splice(index, 1);
            }
        },
        export_as_JSON: function() {
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.canceled_lines = this.canceled_lines;
            data.reason = this.reason;
            data.is_cancelled = this.is_cancelled;
            return data;
        },
        init_from_JSON: function(json) {
            this.canceled_lines = json.canceled_lines;
            this.reason = json.reason;
            this.is_cancelled = json.is_cancelled;
            _super_order.init_from_JSON.call(this, json);
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            this.max_quantity = 1;
            _super_orderline.initialize.apply(this,arguments);
        },
        set_quantity: function(quantity) {
            _super_orderline.set_quantity.apply(this,arguments);
            if (this.max_quantity < Number(quantity)) {
                this.max_quantity = Number(quantity);
                this.order.change_canceled_lines(this);
            } else if(this.max_quantity > Number(quantity)){
                this.order.change_cancelled_quantity(this);
            }
        },
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            data.max_quantity = this.max_quantity;
            return data;
        },
        init_from_JSON: function(json) {
            this.max_quantity = json.max_quantity;
            _super_orderline.init_from_JSON.call(this, json);
        },
    });
    return models;
});
