odoo.define('pos_absolute_discount.screens', function(require){

    var models = require('pos_absolute_discount.models');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var PopupWidget = require('point_of_sale.popups');

    var QWeb = core.qweb;
    var _t = core._t;


    screens.OrderWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent,options);
            this.absolute_discount_active = true;
            this.numpad_state.bind('change:discount', function(){
                self.change_discount_type();
            });
        },
        change_discount_type: function() {
            if (this.absolute_discount_active) {
                this.absolute_discount_active = false;
                $('.discount-mode').removeClass('selected-absolute-discount-mode');
            } else {
                this.absolute_discount_active = true;
                $('.discount-mode').addClass('selected-absolute-discount-mode');
            }
        },
        set_value: function(val) {
            var order = this.pos.get_order();
            var mode = this.numpad_state.get('mode');
            if (order.get_selected_orderline() && mode === 'discount') {
                if (this.absolute_discount_active) {
                    order.get_selected_orderline().set_absolute_discount(Number(val));
                } else {
                    order.get_selected_orderline().set_discount(val);
                }
            } else {
                this._super(val);
            }
        },
    });

    screens.NumpadWidget.include({
        changedMode: function() {
            this._super();
            var mode = this.state.get('mode');
            if (mode === 'discount') {
                $(_.str.sprintf('.mode-button[data-mode="%s"]', mode), this.$el).addClass('discount-mode');
            } else {
                $('.discount-mode').removeClass('selected-absolute-discount-mode');
                $('.discount-mode').removeClass('discount-mode');
            }
            if (this.gui.screen_instances.products) {
                this.gui.screen_instances.products.order_widget.absolute_discount_active = false;
            }
        },
    });

    return screens;
});
