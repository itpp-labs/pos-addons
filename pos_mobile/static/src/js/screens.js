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

            this.max_height = $('body').height();
            this.min_height = $('body').height();

            this.click_categories_slide = function(event){
                self.change_categories_slide();
            };
            this.click_numpad_slide = function(event){
                self.change_numpad_slide();
            };
            this.switch_category_handler = function(event){
                self.set_category(self.pos.db.get_category_by_id(Number(this.dataset.categoryId)));
                self.renderElement();
                self.chrome.swiper_order.slideTo(1);
            };
            this.touch_searchbox = function(event) {
                if (self.current_bottom_slide) {
                    self.close_bottom_menu();
                    if (self.pos.iOS) {
                        self.iOSkeyboard();
                    }
                }
                // specific styles for the iOS platform
                if (self.pos.iOS) {
                    if (event.type === "focusout") {
                        $('.pos.mobile').css({
                            height: self.max_height
                        });
                    }
                }
            };

            var search_timeout = null;
            this.search_handler = function(event){
                if(event.type === "keypress" || event.type === "keydown" || event.keyCode === 46 || event.keyCode === 8){
                    // specific styles for the iOS platform
                    if (self.pos.iOS) {
                        self.iOSkeyboard();
                    }
                    clearTimeout(search_timeout);
                    var searchbox = this;
                    search_timeout = setTimeout(function(){
                        self.perform_search(self.category, searchbox.value, event.which === 13);
                        $('.slide-products .product-list').addClass('iOSkeyboard');
                    },70);
                }
            };
        },
        iOSkeyboard: function() {
            if (window.pageYOffset !== 0 && this.min_height > this.max_height - window.pageYOffset) {
                this.min_height = this.max_height - window.pageYOffset;
            }
            $('body').scrollTop(0);
            $('.pos.mobile').css({
                height: this.min_height
            });
        },
        open_bottom_menu: function() {
            if (this.current_bottom_slide === "numpad") {
                $('.mobile-categories').hide();
                $('.mobile-order-container').removeClass('open-categories-slide');

                $('.mobile-search-bar-menu .swiper-container-numpad').show();
                $('.mobile-order-container').addClass('open-numpad-slide');

            } else if (this.current_bottom_slide === "categories") {
                $('.mobile-search-bar-menu .swiper-container-numpad').hide();
                $('.mobile-order-container').removeClass('open-numpad-slide');

                $('.mobile-categories').show();
                $('.mobile-order-container').addClass('open-categories-slide');
            }
            // open mobile-search-bar-menu
            $('.mobile-order-container').addClass('swipe-is-open');
            if (!this.pos.iOS) {
                setTimeout(function(){
                    $('.order-scroller').getNiceScroll().resize();
                    $('.product-list-scroller').getNiceScroll().resize();
                }, 300)
            }
        },
        close_bottom_menu: function() {
            // remove class
            $('.mobile-order-container').removeClass('open-numpad-slide');
            $('.mobile-order-container').removeClass('open-categories-slide');
            $('.mobile-order-container').removeClass('swipe-is-open');
            this.current_bottom_slide = false;
            if (!this.pos.iOS) {
                setTimeout(function(){
                    $('.order-scroller').getNiceScroll().resize();
                    $('.product-list-scroller').getNiceScroll().resize();
                }, 500)
            }
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
                var slider = this.chrome.swiper_numpad;
                slider.slideTo(0);
            }
        },
        renderElement: function(){
            var self = this;
            this._super.apply(this, arguments);
            // adds event for buttons in search panel
            this.el.querySelector('.slide-categories-button').addEventListener('click', this.click_categories_slide);
            this.el.querySelector('.slide-numpad-button').addEventListener('click', this.click_numpad_slide);

            $('.searchbox input').on("focusout", self.touch_searchbox);
            $('.searchbox input').on("focus input", self.touch_searchbox);
            $('.searchbox input').click(function(){
                self.reset_category();
            });
            var breadcrumbs = $('.window .rightpane .breadcrumbs');
            var active_category_id = $( ".categories .active").data( "category-id" );
            $('.categories span').removeClass('active');
            if (this.category && this.category.child_id && !this.category.child_id.length) {
                if (active_category_id === this.category.id) {
                    if (this.category.parent_id) {
                        this.set_category(this.pos.db.get_category_by_id(this.category.parent_id[0]));
                        this.renderElement();
                    } else {
                        this.reset_category();
                    }
                } else {
                    $('.categories span[data-category-id='+ this.category.id + ']').addClass('active');
                }
            } else {
                if (breadcrumbs.length) {
                    breadcrumbs.detach();
                    $(".mobile-categories .breadcrumbs").detach();
                    $(".mobile-categories").prepend(breadcrumbs);
                }
                var categories = $('.window .rightpane .categories');
                categories.detach();
                $(".mobile-categories .categories").detach();
                $(".mobile-categories").append(categories);
            }

            if (!this.pos.iOS) {
                // add product list scrolling
                $('.product-list-scroller').niceScroll({
                    horizrailenabled: false,
                });
            }
        },
        perform_search: function(category, query, buy_result){
            this._super.apply(this, arguments);
            if (query) {
                this.chrome.swiper_order.slideTo(1);
            }
        },
        clear_search: function(){
            this._super();
            this.reset_category();
            var parent = $(".pos.mobile .mobile-order-container .rightpane-header")[0];
            var input = parent.querySelector('.searchbox input');
                input.value = '';
                input.focus();
        },
        get_image_url: function(category){
            return window.location.origin + '/web/image?model=pos.category&field=image&id='+category.id;
        }
    });

    screens.ProductScreenWidget.include({
        click_product: function(product) {
            this._super.apply(this, arguments);
            var $qty = $('article[data-product-id="'+product.id+'"] .current-order-qty');
            var order = this.pos.get_order();
            var qty = order.get_quantity_by_product_id(product.id);
            if (qty) {
                $qty.html(qty);
            }
            var $p = $('article[data-product-id="'+product.id+'"]');
            var $pi = $('article[data-product-id="'+product.id+'"] img');

            $($p).stop();
            $($pi).stop();

            $($p).animate({
                'opacity': 0.5,
            }, 200, function(){
                $($p).animate({
                    'opacity': 1,
                }, 400);
            });
            $($pi).animate({
                'height': '220px',
                'width': '220px',
            }, 200, function(){
                $($pi).animate({
                    'height': '185px',
                    'width': '185px',
                }, 400);
            });
        },
    });

    screens.ProductListWidget.include({
        renderElement: function() {
            this._super.apply(this, arguments);
            var el = $('.product-list-scroller');
            var scroll = el.getNiceScroll();
            if (scroll.length) {
                scroll.resize();
            } else {
                el.niceScroll({
                    horizrailenabled: false,
                });
            }
        }
    });

    screens.ClientListScreenWidget.include({
        partner_icon_url: function(id){
            return '/web/image?model=res.partner&id='+id+'&field=image_medium';
        },
        show: function(){
            this._super();
            var self = this;
            var search_timeout = null;
            this.$('.searchbox input').on('keydown',function(event){
                clearTimeout(search_timeout);

                var searchbox = this;

                search_timeout = setTimeout(function(){
                    self.perform_search(searchbox.value, event.which === 13);
                },70);
            });
            // new the 'next' button position
            var next_button = this.$('.next');
            next_button.detach();
            this.$('.new-customer').after(next_button);
        }
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
            $('.order-scroller').animate({scrollTop:133 * width}, 200, 'swing');
        },
    });

    screens.PaymentScreenWidget.include({
        renderElement: function(){
            this._super();
            var payment_method = $(".payment-screen .paymentmethods-container");
            payment_method.detach();
            $('.payment-screen .paymentlines-container').after(payment_method);
        }
    });

    screens.OrderWidget.include({
        bind_order_events: function() {
            this._super();
            var self = this;
            var order = this.pos.get_order();
            var lines = order.orderlines;
            lines.bind('change', function(line) {
                self.change_product_qty(line.product.id);
            });
        },
        renderElement: function(scrollbottom){
            this._super(scrollbottom);
            var summary = $('.pos.mobile .order-container .summary.clearfix');
            summary.detach();
            $('.pos.mobile .order-container').append(summary);
            if (!this.pos.iOS) {
                clearTimeout(this.scroll_timeout);
                this.scroll_timeout = setTimeout(function() {
                    $('.order-scroller').niceScroll({
                        horizrailenabled: false,
                    });
                }, 500);
            }
        },
        change_selected_order: function() {
            this._super();
            // go to slide of order
            this.pos.chrome.swiper_order.slideTo(0, 0);
            // close bottom menu after open new order
            if (this.getParent() && this.getParent().product_categories_widget) {
                this.getParent().product_categories_widget.close_bottom_menu();
            }
            this.change_product_qty();
            if (!this.pos.iOS) {
                $('.order-scroller').niceScroll({
                    horizrailenabled: false,
                });
            }
        },
        orderline_change: function(line) {
            this._super(line);
            this.change_product_qty(line.product.id);
        },
        change_product_qty: function(product_id) {
            var order = this.pos.get_order();
            if (order) {
                // update the products qty for current order
                var products = this.pos.gui.screen_instances.products.product_list_widget.product_list;

                // if the product_id is exist then update only this product
                if (product_id) {
                    products = [this.pos.db.get_product_by_id(product_id)];
                }
                products.forEach(function(product){
                    var $qty = $('article[data-product-id="'+product.id+'"] .current-order-qty');
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
