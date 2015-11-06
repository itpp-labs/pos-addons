odoo.define('pos_multi_session_restaurant', function(require){
    var screens = require('point_of_sale.screens')
    var models = require('point_of_sale.models');
    var floors = require('pos_restaurant.floors');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');

    var FloorScreenWidget;
    console.log('gui', gui.Gui.prototype.screen_classes)
    _.each(gui.Gui.prototype.screen_classes, function(){
        if (this.name == 'floors'){
            FloorScreenWidget = this.widget;
            return false;
        }
    })
    var _t = core._t;

    FloorScreenWidget.include({
        start: function() {
            var self = this;
            this._super();
            this.pos.bind('change:orders-count-on-floor-screen', function(){
                self.renderElement();
            })
        }
    })

    screens.OrderWidget.include({
        update_summary: function(){
            var order = this.pos.get('selectedOrder');
            if (order){
                this._super();
            }
        }
    })

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments)
            this.ms_table = false;
            this.ready = this.ready.then(function(){
                             if (self.config.multi_session_table_id){
                                 self.ms_table = self.tables_by_id[self.config.multi_session_table_id[0]]
                                 if (!self.ms_table.floor){
                                     //delay to finish initalisation
                                     setTimeout(function(){
                                         throw new Error(_t("Virtual table is not belonged to this POS."));
                                     }, 5000)
                                 }
                             }
                         })
        },
        ms_create_order: function(){
            var order = PosModelSuper.prototype.ms_create_order.apply(this, arguments)
            if (this.ms_table){
                order.table = this.ms_table;
                order.save_to_db();
            }
            return order;
        },
/*
        ms_orders_to_sync: function(){
            var self = this;
            if (!this.ms_table){
                return PosModelSuper.prototype.ms_orders_to_sync.apply(this, arguments)
            }
            return this.get('orders').filter(function(r){
                       return r.table === self.ms_table;
                   })
        },
*/
        ms_on_add_order: function(current_order){
            if (!current_order && this.ms_table){
                // no current_order, because we on floor screen
                _.each(this.get('orders').models, function(o){
                    if (o.table === this.ms_table && o.ms_replace_empty_order && o.is_empty()){
                        o.destroy({'reason': 'abandon'})
                    }
                })
                this.trigger('change:orders-count-on-floor-screen');
            }else{
                PosModelSuper.prototype.ms_on_add_order.apply(this, arguments)
            }
        }
    })
})