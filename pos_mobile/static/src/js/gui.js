odoo.define('pos_mobile.gui', function (require) {
    "use strict";

    if (!odoo.is_mobile) {
        return;
    }

    var gui = require('point_of_sale.gui');
    var chrome = require('pos_mobile.chrome');

    gui.Gui.include({
        show_screen: function(screen_name,params,refresh,skip_close_popup) {
            this._super(screen_name,params,refresh,skip_close_popup);
            var order = this.pos.get_order();
            var current_screen_name = this.get_current_screen();
            this.change_screen_type(current_screen_name);
        },
        change_screen_type: function(current_screen) {
            var order_container = $('.mobile-order-container');
            if (current_screen === "products") {
                order_container.addClass('mobile-active-screen');
                order_container.css({display:''});
            } else {
                order_container.removeClass('mobile-active-screen');
                order_container.css({display:'none'});
            }
            if ($('.mobile-active-screen').length) {
                $('.pos.mobile .window').css({display: 'none'});
            } else {
                $('.pos.mobile .window').css({display: 'table'});
            }
            if (current_screen === 'clientlist') {
                /*
                  automatically define the height and max-height for the correct
                  height calculation for the subwindow-container-fix block. 2 - height of the border bottom in px
                */

                var client_detail_height = $('.clientlist-screen .subwindow.collapsed').height();
                var new_height = $('.clientlist-screen .full-content').height() - client_detail_height - 2;
                var new_max_height = $('.clientlist-screen .full-content').height() - 2;
                $('.clientlist-screen .subwindow-container-fix.touch-scrollable').css({
                    'height': new_height,
                    'max-height': new_max_height
                });
                // add custom scrolling
                if (!this.pos.iOS) {
                    $('.clientlist-screen .nicescroll-rails').remove();
                    $('.clientlist-screen .subwindow-container-fix.touch-scrollable.scrollable-y').niceScroll();
                }
            } else if (current_screen === 'payment') {
                var height = $('.payment-screen .right-content').height();
                var paymentmethods = $('.payment-screen .paymentmethods-container').height();
                var numpad = $('.payment-screen .payment-numpad').height();
                // automatic define height. 20 the size of the indentation from the bottom block
                $('.paymentlines-container').css({height: height - paymentmethods - numpad - 20});
                // add custom scrolling
                $('.payment-screen .touch-scrollable').niceScroll({
                    horizrailenabled: false,
                });
            }
        }
    });
    return gui;
});
