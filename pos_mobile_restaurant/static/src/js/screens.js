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

    screens.ProductListWidget.include({
        renderElement: function() {
            this._super();
            if (!this.pos.iOS) {
                var scroll = $('.product-list-scroller').getNiceScroll();
                if(scroll && scroll.length) {
                    scroll.resize();
                } else {
                    $('.product-list-scroller').niceScroll({
                        horizrailenabled: false,
                    });
                }
            }
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
        }
    });

    return screens;
});
