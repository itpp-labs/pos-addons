odoo.define('pos_mobile.models', function (require) {
    "use strict";
    if (!odoo.is_mobile) {
        return;
    }

    var models = require('point_of_sale.models');

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
         initialize: function(attributes,options){
            var self = this;
            var res = _super_order.initialize.call(this, attributes,options);
            this.orderlines.on('change', function(line){
                self.pos.gui.screen_instances.products.order_widget.change_product_qty(line.product.id);
            });
            return res;
        },
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

    return models;
});
