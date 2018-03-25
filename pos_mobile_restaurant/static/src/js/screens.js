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

    screens.OrderWidget.include({
        renderElement: function(scrollbottom){
            this._super(scrollbottom);
            /* If POS Order Note was installed */
            var order_note = $('.slide-order .order-note-line');
            if (order_note.length) {
                order_note.detach();
                $('.slide-order .order-scroller').append(order_note);
            }
        },
        scroll_to_selected_order: function() {
            if (this.pos.table) {
                var orders = this.pos.get_table_orders(this.pos.table);
                var selected_order = this.pos.get_order();
                var width = orders.indexOf(selected_order);
                var floor_button_width = $('.pos-rightheader .floor-button').width() + 50;
                $('.pos-rightheader .orders.touch-scrollable').scrollLeft(floor_button_width + (105 * width));
            } else {
                this._super();
            }
        }
    });

    return screens;
});
