odoo.define('pos_mobile_restaurant.floors', function (require) {
    "use strict";

    if (!odoo.is_mobile) {
        return;
    }

    var floors = require('pos_restaurant.floors');
    var chrome = require('pos_mobile_restaurant.chrome');

    floors.FloorScreenWidget.include({
        renderElement: function(){
            this._super();
            var self = this;
            var floor_flexbox = $('.window .floor-screen .screen-content-flexbox');
            if (floor_flexbox.length) {
                floor_flexbox.detach();
                $('.swiper-slide .screen-content-flexbox').remove();
                $(".slide-floor-map").append(floor_flexbox);

                // menu button
                this.pos.chrome.menuButton = $('.swiper-slide .menu-button');
                this.pos.chrome.menu_is_opened = false;
                this.pos.chrome.menuButton.click(function(){
                    self.pos.chrome.menu_button_click();
                });
            }
        }
    });

    floors.TableWidget.include({
        //  Different from Original: remove all styles specific for each table
        table_style: function(){
            var table = this.table;
            function unit(val){
                return val + 'px';
            }
            var style = {};
            if (table.color) {
                style.background = table.color;
            }
            if (table.height >= 300 && table.width >= 300) {
                style['font-size'] = '64px';
            }
            return style;
        },
    });

    return floors;
});
