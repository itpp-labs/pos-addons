odoo.define('pos_restaurant_base.screens', function (require) {
    "use strict";

    var screens = require('point_of_sale.screens');

    screens.OrderWidget.include({
        orderline_change: function(line) {
            // DIFFERENCES FROM ORIGINAL:
            // * move rendering to a separate function
            this.orderline_change_line(line);
            this.update_summary();
        },
        orderline_change_line: function(line) {
            if (line.node && line.node.parentNode) {
                this.rerender_orderline(line);
            }
        }
    });

    return screens;
});
