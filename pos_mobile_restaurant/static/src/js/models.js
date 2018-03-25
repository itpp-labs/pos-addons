odoo.define('pos_mobile_restaurant.models', function (require) {
    "use strict";
    if (!odoo.is_mobile) {
        return;
    }

    var models = require('pos_mobile.models');

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            this.saved_floors_data = {};
            return _super_posmodel.initialize.call(this, session, attributes);
        },
        set_table: function(table) {
            this.table = table;
            var orders = this.get_order_list();
            if (this.table && !this.order_to_transfer_to_different_table && this.config.show_number_guests && !orders.length) {
                this.gui.screen_instances.products.action_buttons.guests.button_click();
            } else {
                _super_posmodel.set_table.call(this, table);
            }
        }
    });

    return models;
});
