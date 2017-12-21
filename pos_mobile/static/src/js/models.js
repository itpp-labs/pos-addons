odoo.define('pos_mobile.models', function (require) {
    "use strict";
    if (!odoo.is_mobile) {
        return;
    }

    var models = require('point_of_sale.models');

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        get_quantity_by_product_id: function(id){
            var lines = this.get_orderlines().filter(function(line){
                return line.product.id === id;
            });
            var qty = 0;
            lines.forEach(function(line){
                qty += line.quantity;
            });
            return qty;
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        set_quantity: function(quantity){
            _super_orderline.set_quantity.call(this, quantity);
            var self = this;
            if (this.pos.get_order()) {
                self.pos.gui.screen_instances.products.order_widget.change_product_qty(self.product.id);
            }
        },
    });
    return models;
});
