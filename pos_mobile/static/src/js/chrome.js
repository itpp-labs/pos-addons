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

            // element before the closing button in top header
            $($('.pos-rightheader .oe_status')[0]).css({'margin-right': '70px'});
        },
    });

    chrome.OrderSelectorWidget.include({
        order_click_handler: function(event,$el) {
            this._super(event,$el);
            var order = this.get_order_by_uid($el.data('uid'));
            if (order) {
                this.chrome.swiper_order.slideTo(0, 0);
            }
        },
        neworder_click_handler: function(event, $el) {
            this._super(event,$el);
            this.chrome.swiper_order.slideTo(0, 0);
        },
        deleteorder_click_handler: function(event, $el) {
            this._super(event,$el);
            this.chrome.swiper_order.slideTo(0, 0);
            this.pos.gui.screen_instances.products.order_widget.scroll_to_selected_order();
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

    return chrome;
});
