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
        },
        renderElement: function(){
            this._super();
            // add scrollBar like iOS scrollBar
            if (!this.pos.iOS) {
                $('.tables').slimScroll({
                    height: '100%',
                    size: '6px',
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
        destroy: function() {
            if(this.$el && this.$el.hasClass('table')) {
                return;
            }
            this._super();
        },
        renderElement: function(){
            /*
                The 'drag' events in original code was added because on touch devices it is sometimes
                not easy to click, especially on small elements. You have to touch and
                release the screen without moving your finger.

                The pos_mobile_restaurant module adds scroll to table view, so we need to remove the 'drag' event
                to make it work.

                TODO: Make it without removing events
            */
            this._super();
            this.$el.off('dragstart');
            this.$el.off('drag');
            this.$el.off('dragend');
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
