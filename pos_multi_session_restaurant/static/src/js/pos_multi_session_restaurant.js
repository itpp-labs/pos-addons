odoo.define('pos_multi_session_restaurant', function(require){
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var multiprint = require('pos_restaurant.multiprint');
    var floors = require('pos_restaurant.floors');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var chrome = require('point_of_sale.chrome');
    var multi_session = require('pos_multi_session');

    var _t = core._t;


    gui.Gui.prototype.screen_classes.filter(function(el) {
        return el.name === 'splitbill';
    })[0].widget.include({
        pay: function(order,neworder,splitlines){
            this._super(order,neworder,splitlines);
            neworder.save_to_db();
        }
    });

    screens.OrderWidget.include({
        update_summary: function(){
            var order = this.pos.get('selectedOrder');
            if (!order){
                return;
            }
            this._super();
        },
        remove_orderline: function(order_line){
            if (this.pos.get_order() && this.pos.get_order().get_orderlines().length === 0){
                this._super(order_line);
            } else {
                order_line.node.parentNode.removeChild(order_line.node);
            }
        }
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var ms_model = {
                model: 'pos.multi_session',
                fields: ['name','floor_ids'],
                domain: null,
                loaded: function(self,floor_set){
                    self.multi_session_floors = floor_set;
            }};
            this.models.splice(
                1 + this.models.indexOf(_.find(this.models, function(model){
                    return model.model === 'pos.config';
                })), 0, ms_model);
            var floor_model = _.find(this.models, function(model){
                return model.model === 'restaurant.floor';
            });
            floor_model.domain = function(self){
                var temporary = [['id','in',self.config.floor_ids]];
                if (self.config.multi_session_id){
                    var ms_floors = _.find(self.multi_session_floors, function(session){
                        return session.id === self.config.multi_session_id[0];
                    });
                    temporary = [['id','in', ms_floors.floor_ids]];
                }
                return temporary;
            };
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.ready.then(function () {
                if (!self.config.multi_session_id){
                    return;
                }
                self.multi_session.floor_ids = self.multi_session_floors.floor_ids;
                self.config.floor_ids = self.multi_session.floor_ids;
            });
        },
        add_new_order: function(){
            var self = this;
            PosModelSuper.prototype.add_new_order.apply(this, arguments);
            if (this.multi_session){
                var current_order = this.get_order();
                current_order.ms_update();
                current_order.save_to_db();
            }
        },
        ms_create_order: function(options){
            var self = this;
            var order = PosModelSuper.prototype.ms_create_order.apply(this, arguments);
            if (options.data.table_id) {
                order.table = self.tables_by_id[options.data.table_id];
                order.customer_count = options.data.customer_count;
                order.save_to_db();
            }
            return order;
        },
        ms_on_update: function(message, sync_all){
            var self = this;
            var data = message.data || {};
            var order = false;
            var old_order = this.get_order();

            if (data.uid){
                order = this.get('orders').find(function(ord) {
                    return ord.uid === data.uid;
                });
            }
            if (order && order.table && order.table.id !== data.table_id) {
                order.transfer = true;
                order.destroy({'reason': 'abandon'});
            }
            PosModelSuper.prototype.ms_on_update.apply(this, arguments);
            if ((order && old_order && old_order.uid !== order.uid) || (old_order === null)) {
                this.set('selectedOrder',old_order);
            }
            if (!sync_all && this.gui.screen_instances.floors && this.gui.get_current_screen() === "floors") {
                this.gui.screen_instances.floors.renderElement();
            }
        },
        ms_do_update: function(order, data){
            PosModelSuper.prototype.ms_do_update.apply(this, arguments);
            if (order) {
                order.set_customer_count(data.customer_count, true);
                order.saved_resume = data.multiprint_resume;
                order.trigger('change');
            }
        },
        // changes the current table.
        set_table: function(table) {
            var self = this;
            if (table && this.order_to_transfer_to_different_table) {
                this.order_to_transfer_to_different_table.table = table;
                this.order_to_transfer_to_different_table.ms_update();
                this.order_to_transfer_to_different_table = null;
                // set this table
                this.set_table(table);
            } else {
                PosModelSuper.prototype.set_table.apply(this, arguments);
            }
        }
    });

    var OrderSuper = models.Order;
    models.Order = models.Order.extend({
        set_customer_count: function (count, skip_ms_update) {
            OrderSuper.prototype.set_customer_count.apply(this, arguments);
            if (!skip_ms_update) {
                this.ms_update();
            }
        },
        ms_remove_order: function() {
            if (this.transfer) {
                return;
            }
            return OrderSuper.prototype.ms_remove_order.call(this, arguments);
        },
    });

    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        get_line_diff_hash: function(){
            var res = OrderlineSuper.prototype.get_line_diff_hash.apply(this, arguments);
            res = res.split('|');
            res[0] = this.uid;
            res = res.join('|');
            return res;
        },
        /*  There is no need to check the presence of super method.
            Because pos_multi_session_restaurant is loaded later than pos_multi_session.
        */
        apply_ms_data: function(data) {
            if(typeof data.mp_dirty !== 'undefined'){
                this.set_dirty(data.mp_dirty);
            }
            if(typeof data.mp_skip !== 'undefined'){
                this.set_skip(data.mp_skip);
            }
            if(typeof data.note !== 'undefined'){
                this.set_note(data.note);
            }
            OrderlineSuper.prototype.apply_ms_data.apply(this, arguments);
        },
    });

    var MultiSessionSuper = multi_session.MultiSession;
    multi_session.MultiSession = multi_session.MultiSession.extend({
        sync_all: function(data) {
            MultiSessionSuper.prototype.sync_all.apply(this, arguments);
            if (this.pos.gui.screen_instances.floors && this.pos.gui.get_current_screen() === "floors") {
                this.pos.gui.screen_instances.floors.renderElement();
            }
        }
    });

    floors.FloorScreenWidget.include({
        init: function(parent, options) {
            this._super(parent, options);
            this.saved_data = false;
        },
        show: function(){
            if (this.pos.debug) {
                console.log("renderElement of TableWidget");
            }
            this._super();
        },
        renderElement: function(){
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
            var self = this;
            var collection = this.get_current_data();
            this.saved_data = JSON.stringify(collection);
        },
        compare_data: function() {
            var collection = this.get_current_data();
            return this.saved_data === JSON.stringify(collection);
        },
        get_current_data: function(){
            var self = this;
            var tables = this.floor.tables;

            var collection = [];
            tables.forEach(function(table) {
                collection.push({
                    'floor': {
                        'background_color': table.floor.background_color,
                        'name': table.floor.name,
                        'sequence': table.floor.sequence,
                    },
                    'name': table.name,
                    'height': table.height,
                    'position_h': table.position_h,
                    'position_v': table.position_v,
                    'seats': table.seats,
                    'shape': table.shape,
                    'width': table.width,
                    'order_count': self.pos.get_table_orders(table).length,
                    'customer_count': self.pos.get_customer_count(table),
                    'fill': Math.min(1,Math.max(0,self.pos.get_customer_count(table) / table.seats)),
                    'notifications': self.get_notifications(table),
                });
            });
            return collection;
        },
        get_notifications: function(table){
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
});
