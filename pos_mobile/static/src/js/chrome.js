odoo.define('pos_mobile.chrome', function (require) {
    "use strict";
    if (!odoo.is_mobile) {
        return;
    }

    var screens = require('pos_mobile.screens');
    var chrome = require('point_of_sale.chrome');

    chrome.Chrome.include({
        // This method instantiates all the screens, widgets, etc.
        build_widgets: function() {
            this._super();

            $('.pos').addClass('mobile');

            this.swiper_order = new window.Swiper(".swiper-container-order", {
                spaceBetween: 0,
                resistanceRatio: 0,
                touchAngle: 30,
                threshold: 10,
            });

            this.swiper_numpad = new window.Swiper(".swiper-container-numpad", {
                spaceBetween: 0,
            });

            // move some widgets and screens from screen block to slide blocks
            var products = $('.rightpane .content-row');
            products.detach();
            $(".slide-products").append(products);

            var order = $('.leftpane .order-container');
            order.detach();
            $('.slide-order').append(order);

            var summary = $('.pos.mobile .order-container .summary.clearfix');
            summary.detach();
            $('.pos.mobile .order-container').append(summary);

            var pads = $('.leftpane .pads');
            pads.detach();
            $('.slide-numpad').append(pads);

            var breadcrumbs = $('.breadcrumbs');
            breadcrumbs.detach();
            $('.mobile-categories').prepend(breadcrumbs);

            var search = $('.rightpane-header');
            search.detach();
            $('.mobile-search-bar').append(search);

            var buttons = $('.control-buttons');
            if (!buttons.hasClass('oe_hidden')) {
                this.swiper_numpad.appendSlide('<div class="swiper-slide slide-buttons"></div>');
                buttons.detach();
                $('.slide-buttons').append(buttons);
            }

            var payment_method = $(".payment-screen .paymentmethods-container");
            payment_method.detach();
            $('.payment-screen .paymentlines-container').after(payment_method);

            // element before the closing button in top header
            $($('.pos-rightheader .oe_status')[0]).css({'margin-right': '70px'});
        },
    });

    chrome.HeaderButtonWidget.include({
        confirm_img: '<img src="/pos_mobile/static/src/img/svg/confirm.svg"/>',
        cancel_img: '<img src="/pos_mobile/static/src/img/svg/close.svg"/>',
        renderElement: function(){
            var self = this;
            this._super();
            if(this.action){
                this.$el.append(this.cancel_img);
                this.$el.click(function(){
                    self.change_action();
                });
            }
        },
        change_action: function() {
            var self = this;
            if (!this.confirmed_change) {
                this.$el.text('');
                this.$el.append(self.confirm_img);
                this.confirmed_change = setTimeout(function(){
                    self.$el.text('');
                    self.$el.append(self.cancel_img);
                    self.confirmed_change = false;
                },2000);
            }
        },
    });

    chrome.OrderSelectorWidget.include({
        renderElement: function() {
            this._super.apply(this, arguments);
            this.scroll_to_selected_order();
        },
        scroll_to_selected_order: function() {
            var orders = this.pos.get('orders');
            var selected_order = this.pos.get_order();
            var width = orders.indexOf(selected_order);
            $('.pos-rightheader .orders.touch-scrollable').scrollLeft(105 * width);
        },
    });

    return chrome;
});
