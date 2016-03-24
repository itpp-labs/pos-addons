odoo.define('pos_multi_session_restaurant', function(require){
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var multiprint = require('pos_restaurant.multiprint');
    var floors = require('pos_restaurant.floors');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var chrome = require('point_of_sale.chrome');

    var FloorScreenWidget;
    //console.log('gui', gui.Gui.prototype.screen_classes);
    _.each(gui.Gui.prototype.screen_classes, function(o){
        if (o.name == 'floors'){
            FloorScreenWidget = o.widget;
            FloorScreenWidget.include({
                start: function () {
                    var self = this;
                    this._super();
                    this.pos.bind('change:orders-count-on-floor-screen', function () {
                        self.renderElement();
                    })
                }
            });
            return false;
        }
    });
    var _t = core._t;


    screens.OrderWidget.include({
        update_summary: function(){
            var order = this.pos.get('selectedOrder');
            if (order){
                this._super();
            }
        }
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments)
            this.ms_table = false;
        },
        ms_create_order: function(options){
            var self = this;
            var order = PosModelSuper.prototype.ms_create_order.apply(this, arguments);
            if (options.data.table_id) {
                order.table = self.tables_by_id[options.data.table_id];
                order.customer_count = options.data.customer_count;
                order.save_to_db();
            }
            else if (this.ms_table){
                order.table = this.ms_table;
                order.save_to_db();
            }
            return order;
        },
        ms_do_update: function(order, data){
           PosModelSuper.prototype.ms_do_update.apply(this, arguments);
            if (order) {
                order.set_customer_count(data.customer_count, true);
                this.gui.screen_instances['products'].action_buttons['guests'].renderElement();
            }
        },
        ms_orders_to_sync: function(){
            var self = this;
            if (!this.ms_table){
                return PosModelSuper.prototype.ms_orders_to_sync.apply(this, arguments)
            }
            return this.get('orders').filter(function(r){
                       return r.table === self.ms_table;
                   })
        },
        ms_on_add_order: function(current_order){
            if (!current_order){
                // no current_order, because we on floor screen
                _.each(this.get('orders').models, function(o){
                    if (o.table === this.ms_table && o.ms_replace_empty_order && o.is_empty()){
                        o.destroy({'reason': 'abandon'})
                    }
                });
                this.trigger('change:orders-count-on-floor-screen');
            }else{
                PosModelSuper.prototype.ms_on_add_order.apply(this, arguments)
            }
        }
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        set_customer_count: function (count, skip_ms_update) {
            _super_order.set_customer_count.apply(this, arguments);
            if (!skip_ms_update) {
                this.ms_update();
            }
        },
        printChanges: function(){
            _super_order.printChanges.apply(this, arguments);
            this.just_printed = true;
        },
        export_as_JSON: function(){
            var json = _super_order.export_as_JSON.apply(this,arguments);
            json.just_printed = this.just_printed;
            return json;
        },
    });
});
