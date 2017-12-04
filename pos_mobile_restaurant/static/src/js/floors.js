odoo.define('pos_mobile_restaurant.floors', function (require) {
    "use strict";

    if (!odoo.is_mobile) {
        return;
    }

    var floors = require('pos_restaurant.floors');
    var chrome = require('pos_mobile_restaurant.chrome');

    floors.FloorScreenWidget.include({
        click_floor_button: function(event,$el){
            this._super(event,$el);
            this.chrome.menuButton.trigger('click');
        },
        renderElement: function(){
            this._super();
            var floor_selector = $('.window .floor-selector');
            if (floor_selector.length) {
                floor_selector.detach();
                $(".slide-floor-menu .floor-selector").detach();
                $(".slide-floor-menu").append(floor_selector);
            }
            var floor_map = $('.window .floor-map');
            if (floor_map.length){
                floor_map.detach();
                $(".slide-floor-map .floor-map").detach();
                $(".slide-floor-map").append(floor_map);
            }
        },
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
