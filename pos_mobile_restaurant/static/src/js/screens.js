odoo.define('pos_mobile_restaurant.screens', function (require) {
    "use strict";
    if (!odoo.is_mobile)
        return;

    var screens = require('pos_mobile.screens');

    screens.ProductScreenWidget.include({
        start: function(){
            this._super();

            var order = this.order_widget.$el;
            order.detach();
            $('.slide-order').append(order);
        },
    });

    return screens;
});
