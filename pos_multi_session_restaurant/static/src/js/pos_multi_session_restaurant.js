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
                    });
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
                var buttons = this.getParent().action_buttons;
                if (buttons && buttons.submit_order && this.all_lines_printed(order)) {
                    buttons.submit_order.highlight(false);
                }
            }
        },
        all_lines_printed: function (order) {
            not_printed_line = order.orderlines.find(function(lines){
                                return lines.mp_dirty;
                            });
            return !not_printed_line;
        }
    });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments);
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
        ms_do_update: function(order, data){
           PosModelSuper.prototype.ms_do_update.apply(this, arguments);
            if (order) {
                order.set_customer_count(data.customer_count, true);
                order.saved_resume = data.multiprint_resume;
                this.gui.screen_instances.products.action_buttons.guests.renderElement();
            }
        },
        ms_on_add_order: function(current_order){
            if (!current_order){
                this.trigger('change:orders-count-on-floor-screen');
            }else{
                PosModelSuper.prototype.ms_on_add_order.apply(this, arguments);
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
        printChanges: function(){
            OrderSuper.prototype.printChanges.apply(this, arguments);
            this.just_printed = true;
        },
    });
});
