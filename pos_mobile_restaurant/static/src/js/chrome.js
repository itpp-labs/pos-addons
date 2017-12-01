odoo.define('pos_mobile_restaurant.chrome', function (require) {
    "use strict";
    if (!odoo.is_mobile) {
        return;
    }

    var screens = require('pos_mobile.screens');
    var chrome = require('pos_mobile.chrome');

    chrome.Chrome.include({
        // This method instantiates all the screens, widgets, etc.
        build_widgets: function() {
            this._super();
            var self = this;

            // floor swiper
            this.swiper_floor = new window.Swiper('.swiper-floor-container', {
                slidesPerView: 'auto',
                initialSlide: 1,
                resistanceRatio: 0,
                slideToClickedSlide: true,
            });

            // remove all events for floor swiper
            this.swiper_floor.destroy(false , false);

            // event for menu button
            this.menuButton = $('.slide-floor-map .menu-button');
            this.menu_is_opened = false;

            this.menuButton.click(function(){
                var slider = self.swiper_floor;
                if (self.menu_is_opened) {
                    slider.slideNext();
                    self.menuButton.removeClass('cross');
                    self.menu_is_opened = false;
                } else {
                    slider.slidePrev();
                    self.menuButton.addClass('cross');
                    self.menu_is_opened = true;
                }
            });

            var floor_selector = $('.floor-selector');
            floor_selector.detach();
            $(".slide-floor-menu").append(floor_selector);

            var floor_map = $('.floor-map');
            floor_map.detach();
            $(".slide-floor-map").append(floor_map);

            var order_button = $('.control-button.order-submit');
            order_button.detach();
            $(".swiper-order-container .slide-search .searchbox").prepend(order_button);

            // add a div for specific control buttons
            $('.slide-numpad .pads').prepend("<div class='top-control-buttons'></div>");

            var guests = $('.control-button.order-guests');
            var discount = $('.control-button.js_discount');
            var note = $('.control-button.order-note');

            guests.detach();
            discount.detach();
            note.detach();

            $('.top-control-buttons').append(guests);
            $('.top-control-buttons').append(discount);
            $('.top-control-buttons').append(note);

            var action_buttons = $('.control-button.order-printbill');
            action_buttons.detach();
            $('.slide-numpad .actionpad').prepend(action_buttons);
        },
    });

    return chrome;
});
