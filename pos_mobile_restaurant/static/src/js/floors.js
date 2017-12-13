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
            var id = $el.data('id');
            var floor = this.pos.floors_by_id[id];
            var slide = $('div[data-id='+id+'][id=slide-floor]').index();
            this.chrome.swiper_floors.slideTo(slide);
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
        destroy: function() {
            if(this.$el && this.$el.hasClass('table')) {
                return;
            }
            this._super();
        }
    });

    return floors;
});
