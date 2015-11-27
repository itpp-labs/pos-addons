odoo.define('pos_fiscal_floor', function (require) {

    var screens = require('point_of_sale.screens');
    require('pos_restaurant.floors');
    var models = require('point_of_sale.models');

    screens.OrderWidget.include({
        update_summary: function () {
            this._super();
            var order = this.pos.get_order();
            if (order.fiscal_position == undefined) {
                var f_id = posmodel.table.floor.pos_default_fiscal[0];
                var f_name = posmodel.table.floor.pos_default_fiscal[1];
                obj = _.find(this.pos.fiscal_positions, function(obj) { return obj.id == f_id })
                order.fiscal_position = obj;
                order.trigger('change');
            }
        }
    })


    models.load_models({
    model: 'restaurant.floor',
    fields: ['name','pos_default_fiscal','background_color','table_ids','sequence'],
    domain: function(self){ return [['pos_config_id','=',self.config.id]]; },
    loaded: function(self,floors){
        self.floors = floors;
        self.floors_by_id = {};
        for (var i = 0; i < floors.length; i++) {
            floors[i].tables = [];
            self.floors_by_id[floors[i].id] = floors[i];
        }

        // Make sure they display in the correct order
        self.floors = self.floors.sort(function(a,b){ return a.sequence - b.sequence; });

        // Ignore floorplan features if no floor specified.
        self.config.iface_floorplan = !!self.floors.length;
    },
});


})