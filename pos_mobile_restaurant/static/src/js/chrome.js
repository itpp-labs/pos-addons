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
            this.swiper_floor = new window.Swiper('.swiper-container-floor', {
                slidesPerView: 'auto',
                initialSlide: 1,
                resistanceRatio: 0,
                slideToClickedSlide: true,
            });

            // remove all events for floor swiper
            this.swiper_floor.destroy(false , false);

            // event for menu button
            this.menuButton = $('.menu-button');
            this.menu_is_opened = false;

            this.menuButton.click(function(){
                self.menu_button_click();
            });

            var floor_flexbox = $('.floor-screen .screen-content-flexbox');
            floor_flexbox.detach();
            $(".slide-floor-map").append(floor_flexbox);

            var order_button = $('.control-button.order-submit');
            order_button.detach();
            $(".mobile-search-bar .searchbox").prepend(order_button);

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

            /* The new Printbill Button in ActionpadWidget, delete the old Printbill button */
            var printbill = $('.slide-buttons .control-button.order-printbill');
            printbill.remove();
        },
        menu_button_click: function() {
            var slider = this.swiper_floor;
            if (this.menu_is_opened) {
                slider.slideNext();
                this.menuButton.removeClass('cross');
                this.menu_is_opened = false;
            } else {
                slider.slidePrev();
                this.menuButton.addClass('cross');
                this.menu_is_opened = true;
            }
        }
    });

    return chrome;
});
