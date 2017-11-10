odoo.define('pos_mobile.gui', function (require) {
    "use strict";

    if (!odoo.is_mobile)
        return;

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
            var swiper_order_container = $('.swiper-order-container');
            if (current_screen === "products") {
                swiper_order_container.addClass('mobile-active-screen');
                swiper_order_container.css({display:''});
            } else {
                swiper_order_container.removeClass('mobile-active-screen');
                swiper_order_container.css({display:'none'});
            }
            if ($('.mobile-active-screen').length) {
                $('.pos.mobile .window').css({display: 'none'});
            } else {
                $('.pos.mobile .window').css({display: 'table'});
            }
            if (current_screen === 'clientlist') {
                // automatic define max-height for correct calc the height for
                // subwindow-container-fix block. The 2 - is height 2px border bottom
                var new_height = $('.clientlist-screen .full-content').height() - 2;
                $('.clientlist-screen .subwindow-container-fix').css({'max-height': new_height});
            }
        }
    });
    return gui;
});
