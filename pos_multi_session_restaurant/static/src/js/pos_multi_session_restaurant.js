openerp.pos_multi_session_restaurant = function(instance){
    var module = instance.point_of_sale;
    var _t = instance.web._t;

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        initialize: function(){
            var self = this;
            PosModelSuper.prototype.initialize.apply(this, arguments)
            this.ms_table = false;
            this.ready = this.ready.then(function(){
                             if (self.config.multi_session_table_id){
                                 self.ms_table = self.tables_by_id[self.config.multi_session_table_id[0]]
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
        ms_on_add_order: function(current_order){
            if (!current_order && this.ms_table){
                // no current_order, because we on floor screen
                _.each(this.get('orders').models, function(o){
                    if (o.table === this.ms_table && o.ms_replace_empty_order && o.is_empty()){
                        o.destroy({'reason': 'abandon'})
                    }
                })
            }else{
                PosModelSuper.prototype.ms_on_add_order.apply(this, arguments)
            }
        }
    })
}