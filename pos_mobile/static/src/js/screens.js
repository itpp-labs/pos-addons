odoo.define('pos_mobile.screens', function (require) {
    "use strict";
    if (!odoo.is_mobile)
        return;

    var screens = require('point_of_sale.screens');

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
            this.click_order_slide = function(event){
                self.change_order_slide();
            };
        },
        open_bottom_menu: function() {
            var slider = this.chrome.swiperV;
            slider.slideNext();
        },
        close_bottom_menu: function() {
            var slider = this.chrome.swiperV;
            slider.slidePrev();
            this.current_bottom_slide = false;
            $('.fa-plus-square-o').css('display','inline-block');
            $('.fa-minus-square-o').css('display','none');
        },
        // second horizontal swiper contain categories, numpad and buttons slides
        change_categories_slide: function() {
            if (this.current_bottom_slide === "categories") {
                this.close_bottom_menu();
            } else {
                this.open_bottom_menu();
                var slider = this.chrome.swiperH[1];
                slider.slideTo(0);
                this.current_bottom_slide = "categories";
            }
        },
        change_numpad_slide: function() {
            if (this.current_bottom_slide === "numpad") {
                this.close_bottom_menu();
            } else {
                this.open_bottom_menu();
                var slider = this.chrome.swiperH[1];
                slider.slideTo(1);
                this.current_bottom_slide = "numpad";
                $('.fa-plus-square-o').css('display','none');
                $('.fa-minus-square-o').css('display','inline-block');
            }
        },
        // first horizontal swiper contain order and products slides
        change_order_slide: function() {
            var slider = this.chrome.swiperH[0];
            if (slider.activeIndex === 0) {
                slider.slideNext();
            } else {
                slider.slidePrev();
            }
        },
        renderElement: function(){
            var self = this;
            this._super.apply(this, arguments);
            // adds event for buttons in search panel
            this.el.querySelector('.slide-categories-button').addEventListener('click', this.click_categories_slide);
            this.el.querySelector('.slide-numpad-button').addEventListener('click', this.click_numpad_slide);
            this.el.querySelector('.slide-order-button').addEventListener('click', this.click_order_slide);
        },
    });

    screens.ProductScreenWidget.include({
        click_product: function(product) {
            this._super.apply(this, arguments);
            // adds click effect
            var $p = $('span[data-product-id="'+product.id+'"]');
            $($p).animate({
                'opacity': 0.5,
            }, 200, function(){ $($p).animate({
                'opacity': 1,
            }, 400) } );
            var $pi = $('span[data-product-id="'+product.id+'"] img');
            $($pi).animate({
                'max-height': '120px',
                'min-width': '100px',
            }, 200, function(){ $($pi).animate({
                'max-height': '100px',
                'min-width': '60px',
            }, 400) } );
        },
    });

    return screens;
});
