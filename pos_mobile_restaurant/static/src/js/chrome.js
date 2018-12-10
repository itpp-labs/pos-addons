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
            var self = this;
            // floors swiper (you can to use the 'resistanceRatio': 1 parameter)
            // read more about it http://idangero.us/swiper/api/#parameters
            this.swiper_floors = new window.Swiper('.swiper-container-map', {
                'resistanceRatio': 0
            });

            // Event will be fired after transition to another slide
            this.swiper_floors.on('transitionEnd', function() {
                self.change_current_floor();
            });

            this._super();

            // floor screen swiper
            this.swiper_floor_screen = new window.Swiper('.swiper-container-floor-screen', {
                slidesPerView: 'auto',
                initialSlide: 1,
                resistanceRatio: 0,
                slideToClickedSlide: true,
            });

            // remove all events for floor swiper
            this.swiper_floor_screen.destroy(false , false);

            var floor_selector = $('.floor-screen .floor-selector');
            if (floor_selector.length) {
                floor_selector.detach();
                $(".mobile-floor-selector").append(floor_selector);
            }

            // floors
            if (this.pos.floors) {
                _.each(this.pos.floors, function(floor, index){
                    self.render_all_floors(floor.id, index);
                });
            }

            if (this.pos.floors.length < 2) {
                // remove all events for floors
                this.swiper_floors.destroy(false , false);
            }

            var order_button = $('.control-button.order-submit');
            order_button.detach();
            $(".mobile-order-container .mobile-search-bar .searchbox").prepend(order_button);

            // // show first floor
            if (this.pos.floors && this.pos.floors.length) {
                this.change_current_floor(this.pos.floors[0].id);
            }

            // for compatibility with pos_multi_session_restaurant
            this.pos.bind('change:orders-count-on-floor-screen', function () {
                self.change_current_floor();
            });

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
        render_all_floors: function(id, index) {
            var floor_widget = this.gui.screen_instances.floors;
            floor_widget.floor = this.pos.floors_by_id[id];
            floor_widget.renderElement();
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

            // replace floor selector
            var floor_selector = $('.floor-screen .floor-selector');
            if (floor_selector.length) {
                floor_selector.detach();
                $(".mobile-floor-selector .floor-selector").replaceWith(floor_selector);
            }

            // event for menu button
            this.menuButton = $('.slide-floor-content .menu-button');
            this.menu_is_opened = false;

            this.menuButton.click(function() {
                self.menu_button_click();
            });

            // close left menu
            this.swiper_floor_screen.slideTo(1);
            this.menuButton.removeClass('cross');

            // set active selector
            $('.mobile-floor-selector').find('.button-floor.active').removeClass('active');
            $('.mobile-floor-selector').find('.button-floor[data-id=' + floor_id +']').addClass('active');
            active_floor.find('.tables').getNiceScroll().doScrollPos(0, 0);

            if (!this.pos.iOS) {
                active_floor.find('.tables').niceScroll({
                    horizrailenabled: false,
                    scrollCLass: 'floor-scroll',
                });
            }
        }
    });

    chrome.OrderSelectorWidget.include({
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

    return chrome;
});
