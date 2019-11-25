/* Copyright 2017-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
 * Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_order_cancel.models', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
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
            this.canceled_lines = [];
            _super_order.initialize.apply(this, arguments);
        },
        destroy_and_upload_as_canceled: function(reason, cancelled_reason_ids) {
            reason = reason || '';
            cancelled_reason_ids = cancelled_reason_ids || false;
            var self = this;
            this.is_cancelled = true;
            this.reason = reason;
            while (this.get_orderlines().length) {
                var line = this.get_orderlines()[0];
                this.save_canceled_line(line);
                this.save_reason_cancelled_line(line, _t("Order Deleting") + "; " + reason, cancelled_reason_ids);
                this.remove_orderline(line);
            }
            this.upload_order_as_canceled();
        },
        upload_order_as_canceled: function() {
            var self = this;
            this.pos.push_order(this).then(function() {
                self.destroy({'reason':'abandon'});
            });
        },
        add_cancelled_line: function(line) {
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
            new_line.employee_id = this.pos.get_cashier().id;
            new_line.user_name = this.pos.get_cashier().name;
            line.cancelled_line = new_line;
            this.canceled_lines.push([0, 0, new_line]);
        },
        /*  If pos_multi_session is installed then trigger('new_updates_to_send') is used to sync
            cancelation data accross all POSes
        */
        save_reason_cancelled_line: function(orderline, reason, cancelled_reason_ids) {
            orderline.cancelled_line.reason = reason;
            orderline.cancelled_line.cancelled_reason_ids = cancelled_reason_ids;
            orderline.trigger('change', orderline);
            this.trigger('new_updates_to_send');
        },
        save_canceled_line: function(orderline) {
            if (orderline.cancelled_line && this.is_cancelled) {
                orderline.cancelled_line.qty = orderline.max_quantity;
                orderline.cancelled_line.current_qty = 0;
            } else {
                this.add_cancelled_line(orderline);
            }
            this.trigger('new_updates_to_send');
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
            if (line.cancelled_line) {
                line.cancelled_line.qty = line.max_quantity;
                line.cancelled_line.current_qty = 0;
                if (line.quantity >= 0) {
                    line.cancelled_line.qty = line.max_quantity - line.quantity;
                    line.cancelled_line.current_qty = line.quantity;
                }
                if (!line.cancelled_line.employee_id) {
                    line.cancelled_line.employee_id = this.pos.get_cashier().id;
                    line.cancelled_line.user_name = this.pos.get_cashier().name;
                }
                this.trigger('new_updates_to_send');
            } else if (this.pos.gui && this.pos.gui.screen_instances.products && this.ask_cancel_reason) {
                this.save_canceled_line(line);
                this.pos.gui.screen_instances.products.order_widget.show_popup('product', line);
            }
        },
        remove_canceled_lines: function(line) {
            if (line.cancelled_line && this.canceled_lines) {
                this.canceled_lines = this.canceled_lines.filter(function(l){
                    return l[2].id !== line.cancelled_line.id;
                });
                line.cancelled_line = false;
                line.trigger('change', line);
                this.trigger('new_updates_to_send');
            }
        },
        // This function is used to sync cancelation data accross all POSes
        // (only when pos_multi_session is installed)
        apply_ms_data: function(data) {
            if (_super_order.apply_ms_data) {
                _super_order.apply_ms_data.apply(this, arguments);
            }
            this.canceled_lines = data.canceled_lines || [];
            this.reason = data.reason;
            this.is_cancelled = data.is_cancelled;
        },
        export_as_JSON: function() {
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.canceled_lines = this.canceled_lines || [];
            data.reason = this.reason;
            data.is_cancelled = this.is_cancelled;
            return data;
        },
        init_from_JSON: function(json) {
            this.canceled_lines = json.canceled_lines || [];
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
            this.old_quantity = this.quantity;
            _super_orderline.set_quantity.apply(this,arguments);
            this.check_max_quantity(quantity);
        },
        check_max_quantity: function(quantity) {
            if (this.max_quantity && this.max_quantity <= Number(quantity)) {
                this.max_quantity = Number(quantity);
                this.order.remove_canceled_lines(this);
            } else if(this.max_quantity && this.max_quantity > Number(quantity)) {
                this.order.change_cancelled_quantity(this);
            }
            this.order.ask_cancel_reason = false;
        },
        //  Read more about this function in pos_multi_session module
        apply_ms_data: function(data) {
            if (_super_orderline.apply_ms_data) {
                _super_orderline.apply_ms_data.apply(this, arguments);
            }
            this.max_quantity = data.max_quantity;
            if (data.cancelled_line && this.order.canceled_lines) {
                // order.canceled_lines is already synced
                // here we just update link for cancelled_line
                var cancelled_line = this.order.canceled_lines.find(function(line) {
                    return line[2].id === data.cancelled_line.id;
                });
                if (cancelled_line) {
                    this.cancelled_line = cancelled_line[2];
                }
            }
        },
        cancel_quantity_changes: function() {
            var old_quantity = String(this.old_quantity);
            this.set_quantity(this.old_quantity);
            this.pos.gui.screen_instances.products.numpad.state.set({
                buffer: String(0)
            });
            this.pos.gui.screen_instances.products.numpad.state.appendNewChar(old_quantity);
        },
        export_as_JSON: function() {
            var data = _super_orderline.export_as_JSON.apply(this, arguments);
            data.max_quantity = this.max_quantity;
            data.cancelled_line = this.cancelled_line;
            return data;
        },
        init_from_JSON: function(json) {
            this.max_quantity = json.max_quantity;
            this.cancelled_line = json.cancelled_line;
            _super_orderline.init_from_JSON.call(this, json);
        }
    });
    return models;
});
