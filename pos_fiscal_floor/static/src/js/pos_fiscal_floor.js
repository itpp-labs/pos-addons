odoo.define('pos_fiscal_floor', function (require) {

    var screens = require('point_of_sale.screens');
    require('pos_restaurant.floors');
    var models = require('point_of_sale.models');

    screens.OrderWidget.include({
        update_summary: function () {
            this._super();
            var order = this.pos.get_order();
            if (!order.fiscal_position && posmodel.table) {
                var f_id = posmodel.table.floor.pos_default_fiscal[0];
                var f_name = posmodel.table.floor.pos_default_fiscal[1];
                obj = _.find(this.pos.fiscal_positions, function (obj) {
                    return obj.id == f_id;
                });
                order.fiscal_position = obj;
                if (order.fiscal_position)
                    order.trigger('change');
            }
        }
    });


    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            var floor_model = _.find(this.models, function(model){ return model.model === 'restaurant.floor'; });
            floor_model.fields.push('pos_default_fiscal');
            return _super_posmodel.initialize.call(this, session, attributes);
        }
    })
})
