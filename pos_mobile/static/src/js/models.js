odoo.define("pos_mobile.models", function(require) {
    "use strict";
    if (!odoo.is_mobile) {
        return;
    }

    var models = require("point_of_sale.models");

    models.Order = models.Order.extend({
        get_quantity_by_product_id: function(id) {
            var lines = this.get_orderlines().filter(function(line) {
                return line.product.id === id;
            });
            var qty = 0;
            lines.forEach(function(line) {
                qty += line.quantity;
            });
            return qty;
        },
    });

    return models;
});
