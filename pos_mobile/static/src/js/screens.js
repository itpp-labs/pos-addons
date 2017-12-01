odoo.define('pos_mobile.screens', function (require) {
    "use strict";
    if (!odoo.is_mobile) {
        return;
    }

    var screens = require('point_of_sale.screens');
    var models = require('pos_mobile.models');

    screens.ProductCategoriesWidget.include({
        init: function(parent, options){
            this._super(parent,options);
            var self = this;
            this.click_categories_slide = function(event){
                self.change_categories_slide();
            };
            this.click_numpad_slide = function(event){
                self.change_numpad_slide();
            };
            this.switch_category_handler = function(event){
                self.set_category(self.pos.db.get_category_by_id(Number(this.dataset.categoryId)));
                self.renderElement();
                self.chrome.swiperH[0].slideTo(1);
            };
        },
        open_bottom_menu: function() {
            if (this.current_bottom_slide === "numpad") {
                $('.slide-categories').hide();
                $('.order-swiper').removeClass('open-categories-slide');

                $('.under-search .swiper-wrapper').show();
                $('.order-swiper').addClass('open-numpad-slide');

            } else if (this.current_bottom_slide === "categories") {
                $('.under-search .swiper-wrapper').hide();
                $('.order-swiper').removeClass('open-numpad-slide');

                $('.slide-categories').show();
                $('.order-swiper').addClass('open-categories-slide');
            }

            // open under search block
            $('.order-swiper').addClass('swipe-is-open');
            var slider = this.chrome.swiperV;
            slider.slideNext();
        },
        close_bottom_menu: function() {
            //  close under search block
            var slider = this.chrome.swiperV;
            slider.slidePrev();

            // remove class
            $('.order-swiper').removeClass('open-numpad-slide');
            $('.order-swiper').removeClass('open-categories-slide');
            $('.order-swiper').removeClass('swipe-is-open');
            this.current_bottom_slide = false;
        },
        change_categories_slide: function() {
            if (this.current_bottom_slide === "categories") {
                this.close_bottom_menu();
            } else {
                this.close_bottom_menu();
                this.current_bottom_slide = "categories";
                this.open_bottom_menu();
            }
        },
        change_numpad_slide: function() {
            if (this.current_bottom_slide === "numpad") {
                this.close_bottom_menu();
            } else {
                this.close_bottom_menu();
                this.current_bottom_slide = "numpad";
                this.open_bottom_menu();

                // start slide is numpad slide
                var slider = this.chrome.swiperH[1];
                slider.slideTo(0);
            }
        },
        renderElement: function(){
            var self = this;
            this._super.apply(this, arguments);
            // adds event for buttons in search panel
            this.el.querySelector('.slide-categories-button').addEventListener('click', this.click_categories_slide);
            this.el.querySelector('.slide-numpad-button').addEventListener('click', this.click_numpad_slide);

            var breadcrumbs = $('.window .rightpane .breadcrumbs');
            if (breadcrumbs.length) {
                breadcrumbs.detach();
                $(".slide-categories .breadcrumbs").detach();
                $(".slide-categories").prepend(breadcrumbs);
            }

            var categories = $('.window .rightpane .categories');
            categories.detach();
            $(".slide-categories .categories").detach();
            $(".slide-categories").append(categories);
        },
        perform_search: function(category, query, buy_result){
            this._super.apply(this, arguments);
            if (query) {
                this.chrome.swiperH[0].slideTo(1);
            }
        },
        clear_search: function(){
            this._super();
            var parent = $(".pos.mobile .swiper-container .rightpane-header")[0];
            var input = parent.querySelector('.searchbox input');
                input.value = '';
                input.focus();
        },
        get_image_url: function(category){
            return window.location.origin + '/web/image?model=pos.category&field=image&id='+category.id;
        },
    });

    screens.ProductScreenWidget.include({
        click_product: function(product) {
            this._super.apply(this, arguments);
            var $qty = $('span[data-product-id="'+product.id+'"] .current-order-qty');
            var order = this.pos.get_order();
            var qty = order.get_quantity_by_product_id(product.id);
            if (qty) {
                $qty.html(qty);
            }
            var $p = $('span[data-product-id="'+product.id+'"]');
            $($p).animate({
                'opacity': 0.5,
            }, 200, function(){
                $($p).animate({
                    'opacity': 1,
                }, 400);
            });
            var $pi = $('span[data-product-id="'+product.id+'"] img');
            $($pi).animate({
                'max-height': '240px',
                'min-width': '200px',
            }, 200, function(){
                $($pi).animate({
                    'max-height': '200px',
                    'min-width': '128px',
                }, 400);
            });
        },
    });

    screens.ClientListScreenWidget.include({
        partner_icon_url: function(id){
            return '/web/image?model=res.partner&id='+id+'&field=image_medium';
        },
    });

    screens.NumpadWidget.include({
        clickAppendNewChar: function(event) {
            var res = this._super(event);
            this.scroll_to_selected_line();
            return res;
        },
        scroll_to_selected_line: function() {
            var order = this.pos.get_order();
            var width = order.get_orderlines().indexOf(order.get_selected_orderline());
            $('.order-scroller').animate({scrollTop:104 * width}, 200, 'swing');
        },
    });

    screens.OrderWidget.include({
        renderElement: function(scrollbottom){
            this._super(scrollbottom);
            var summary = $('.pos.mobile .order-container .summary.clearfix');
            summary.detach();
            $('.pos.mobile .order-container').append(summary);
        },
        change_selected_order: function() {
            this._super();
            var order = this.pos.get_order();
            if (order) {
                // update the products qty for current order
                var products = this.pos.gui.screen_instances.products.product_list_widget.product_list
                products.forEach(function(product){
                    var $qty = $('span[data-product-id="'+product.id+'"] .current-order-qty');
                    var qty = order.get_quantity_by_product_id(product.id);
                    $qty.html('');
                    if (qty) {
                        $qty.html(qty);
                    }
                });
            }
        },
    });
    return screens;
});
