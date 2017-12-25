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

            // floor screen swiper
            this.swiper_floor_screen = new window.Swiper('.swiper-container-floor-screen', {
                slidesPerView: 'auto',
                initialSlide: 1,
                resistanceRatio: 0,
                slideToClickedSlide: true,
            });

            // remove all events for floor swiper
            this.swiper_floor_screen.destroy(false , false);

            // floors swiper (you can to use the 'resistanceRatio': 1 parameter)
            // read more about it http://idangero.us/swiper/api/#parameters
            this.swiper_floors = new window.Swiper('.swiper-container-map', {
                'resistanceRatio': 0
            });

            // Event will be fired after transition to another slide
            this.swiper_floors.on('transitionEnd', function() {
                self.change_current_floor();
            });

            var floor_selector = $('.floor-screen .floor-selector');
            if (floor_selector.length) {
                floor_selector.detach();
                $(".mobile-floor-selector").append(floor_selector);
            }

            // floors
            if (this.pos.floors) {
                _.each(this.pos.floors, function(floor, index){
                    self.rerender_floors(floor.id, index);
                });
            }

            if (this.pos.floors.length < 2) {
                // remove all events for floors
                this.swiper_floors.destroy(false , false);
            }

            var order_button = $('.control-button.order-submit');
            order_button.detach();
            $(".mobile-order-container .mobile-search-bar .searchbox").prepend(order_button);

            // show first floor
            if (this.pos.floors && this.pos.floors.length) {
                this.change_current_floor(this.pos.floors[0].id);
            }

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
            var slider = this.swiper_floor_screen;
            if (this.menu_is_opened) {
                slider.slideNext();
                this.menuButton.removeClass('cross');
                this.menu_is_opened = false;
            } else {
                slider.slidePrev();
                this.menuButton.addClass('cross');
                this.menu_is_opened = true;
            }
        },
        rerender_floors: function(id, index) {
            var floor_widget = this.gui.screen_instances.floors;
            floor_widget.floor = this.pos.floors_by_id[id];
            this.swiper_floors.appendSlide('<div class="swiper-slide slide-floor" id="slide-floor" data-id='+id+'></div>');
            floor_widget.renderElement();

            var floor_map = $('.floor-screen .floor-map');
            floor_map.detach();
            $($(".swiper-container-map .swiper-wrapper .slide-floor")[index]).append(floor_map);
        },
        // set or change current order
        change_current_floor: function(id) {
            if (!this.pos.floors || !this.pos.floors.length) {
                return false;
            }
            var self = this;

            var active_floor = $('.slide-floor.swiper-slide-active');
            var floor_id = id || active_floor.data('id');

            this.gui.screen_instances.floors.floor = this.pos.floors_by_id[floor_id];
            this.gui.screen_instances.floors.renderElement();

            var floor_map = $('.floor-screen .floor-map');
            floor_map.detach();
            $('.slide-floor.swiper-slide-active .floor-map').replaceWith(floor_map);

            var floor_selector = $('.floor-screen .floor-selector');
            if (floor_selector.length) {
                floor_selector.detach();
                $(".mobile-floor-selector .floor-selector").replaceWith(floor_selector);
            }

            // event for menu button
            this.menuButton = $('.menu-button');
            this.menu_is_opened = false;

            this.menuButton.click(function(){
                self.menu_button_click();
            });

            // close left menu
            this.swiper_floor_screen.slideTo(1);
        }
    });

    return chrome;
});
