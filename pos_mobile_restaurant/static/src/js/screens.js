odoo.define('pos_mobile_restaurant.screens', function (require) {
    "use strict";
    if (!odoo.is_mobile) {
        return;
    }

    var screens = require('pos_mobile.screens');

    screens.ProductScreenWidget.include({
        start: function(){
            this._super();

            var order = this.order_widget.$el;
            order.detach();
            $('.slide-order').append(order);

        },
    });

    screens.ActionpadWidget.include({
        renderElement: function() {
            var self = this;
            this._super();
            this.$('.order-printbill').click(function(){
                self.gui.screen_instances.products.action_buttons.print_bill.button_click();
            });
        }
    });

    return screens;
});
