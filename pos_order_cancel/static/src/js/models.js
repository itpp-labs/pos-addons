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
            _super_order.initialize.apply(this, arguments);
            this.canceled_lines = [];
        },
        save_canceled_order: function(reason) {
            var self = this;
            this.is_cancelled = true;
            this.reason = reason;
            this.orderlines.each(function(orderline){
                self.save_canceled_line(self.get_last_orderline());
                self.save_reason_cancelled_line(self.get_last_orderline(), _t("Order Deleting"));
                self.remove_orderline(self.get_last_orderline());
            });
            this.pos.push_order(this).then(function() {
                self.destroy({'reason':'abandon'});
            });
        },
        add_cancelled_line: function(line) {
            var new_line = line.export_as_JSON();
            new_line.reason = false;
            if (this.is_cancelled) {
                new_line.qty = line.max_quantity;
            } else {
                new_line.qty = line.max_quantity - line.quantity;
                new_line.canceled_date = this.get_datetime();
            }
            new_line.cancelled_id = line.id;
            new_line.user_id = this.pos.get_cashier().id;
            this.canceled_lines.push([0, 0, new_line]);
        },
        /*  If pos_multi_session is installed then trigger('change:sync') is used to sync
            cancelation data accross all POSes
        */
        save_reason_cancelled_line: function(orderline, reason) {
            var exist_cancelled_line = this.get_exist_cancelled_line(orderline.id);
            exist_cancelled_line[2].reason = reason;
            this.trigger('change:sync');
        },
        save_canceled_line: function(orderline) {
            var exist_cancelled_line = this.get_exist_cancelled_line(orderline.id);
            if (exist_cancelled_line && this.is_cancelled) {
                exist_cancelled_line[2].qty = orderline.max_quantity;
            } else {
                this.add_cancelled_line(orderline);
            }
            this.trigger('change:sync');
        },
        get_exist_cancelled_line: function(id) {
            return this.canceled_lines.find(function(exist_line) {
                return id === exist_line[2].cancelled_id;
            });
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
            if (!line) {
                return;
            }
            var exist_cancelled_line = this.get_exist_cancelled_line(line.id);
            if (exist_cancelled_line) {
                exist_cancelled_line[2].qty = line.max_quantity - line.quantity;
                exist_cancelled_line[2].user_id = this.pos.get_cashier().id;
                this.trigger('change:sync');
            } else if (this.pos.gui && this.pos.gui.screen_instances.products && this.ask_cancel_reason) {
                this.save_canceled_line(line);
                this.pos.gui.screen_instances.products.order_widget.show_popup('product', line);
            }
        },
        change_canceled_lines: function(line) {
            var exist_cancelled_line = this.get_exist_cancelled_line(line.id);
            if (exist_cancelled_line) {
                var index = this.canceled_lines.indexOf(exist_cancelled_line);
                this.canceled_lines.splice(index, 1);
            }
        },
        // This function is used to sync cancelation data accross all POSes
        // (only when pos_multi_session is installed)
        apply_ms_data: function(data) {
            if (_super_order.apply_ms_data) {
                _super_order.apply_ms_data.apply(this, arguments);
            }
            this.canceled_lines = data.canceled_lines;
            this.reason = data.reason;
            this.is_cancelled = data.is_cancelled;
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
            } else if(this.max_quantity > Number(quantity)) {
                this.order.change_cancelled_quantity(this);
                this.order.ask_cancel_reason = false;
            }
        },
        //  Read more about this function in pos_multi_session module
        apply_ms_data: function(data) {
            if (_super_orderline.apply_ms_data) {
                _super_orderline.apply_ms_data.apply(this, arguments);
            }
            this.max_quantity = data.max_quantity;
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
