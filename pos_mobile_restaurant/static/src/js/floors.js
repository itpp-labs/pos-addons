odoo.define('pos_mobile_restaurant.floors', function (require) {
    "use strict";

    if (!odoo.is_mobile) {
        return;
    }

    var floors = require('pos_restaurant.floors');
    var chrome = require('pos_mobile_restaurant.chrome');
    var core = require('web.core');

    var _t = core._t;

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
        click_handler: function(){
            // if it's not slide transition then it's click
            if (!this.pos.chrome.floors_slide_transition) {
                this._super();
            }
        },
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

    floors.TableGuestsButton.include({
        button_click: function() {
            var self = this;
            if (this.pos.get_order()) {
                this._super();
            } else {
                this.gui.show_popup('number', {
                    'title':  _t('Guests ?'),
                    'cheap': true,
                    'value':   0,
                    'confirm': function(value) {
                        value = Math.max(1,Number(value));
                        self.pos.add_new_order();
                        self.pos.get_order().set_customer_count(value);
                        self.renderElement();
                    },
                    'cancel': function() {
                        self.pos.table = null;
                    },
                });
            }
        },
    });

    return floors;
});
