odoo.define('pos_discount_absolute', function (require) {
"use strict";


    var models = require('point_of_sale.models');
    var gui = require('point_of_sale.gui');
    var Widget = require('web.Widget');
    var PosBaseWidget = require('point_of_sale.BaseWidget');

    PosBaseWidget.include({
        init:function(parent,options){
            var self = this;
            this._super(parent,options);
            if (this.gui && this.gui.screen_instances.products &&
                this.gui.screen_instances.products.action_buttons.discount && this.pos.config.discount_abs) {
                var disc_widget = this.gui.screen_instances.products.action_buttons.discount;
                disc_widget.button_click = function () {
                    self.gui.show_popup('number', {
                        'title': 'Absolute Discount',
                        'value': self.pos.config.discount_abs_value,
                        'confirm': function (val) {
                            self.gui.screen_instances.products.action_buttons.discount.apply_abs_discount(val);
                        },
                    });
                };
            }
        },
        apply_abs_discount: function(val) {
            var order    = this.pos.get_order();
            var lines    = order.get_orderlines();
            var product  = this.pos.db.get_product_by_id(this.pos.config.discount_product_id[0]);
            // Remove existing discounts
            var i = 0;
            while ( i < lines.length ) {
                if (lines[i].get_product() === product) {
                    order.remove_orderline(lines[i]);
                } else {
                    i++;
                }
            }
            // Add discount
            var discount = Math.max(order.get_total_with_tax() - val, 0);
            order.add_product(product, { price: discount });
        },
    });

});

//            if (this.gui && this.gui.popup_instances.number) {
//                var num_widget = this.gui.popup_instances.number;
//                this.gui.popup_instances.number.click_confirm = function () {
//                    self.gui.close_popup();
//                    if( num_widget.options.confirm ){
//                        if (num_widget.input_disc_program) {
//                            self.pos.get_discount_category(num_widget.discount_program_id);
//                        }
//                        num_widget.options.confirm.call(num_widget,num_widget.inputbuffer);
//                    }
//                };
//                this.gui.popup_instances.number.click_numpad = function(event){
//                    var newbuf = self.gui.numpad_input(
//                        num_widget.inputbuffer,
//                        $(event.target).data('action'),
//                        {'firstinput': num_widget.firstinput});
//
//                    num_widget.firstinput = (newbuf.length === 0);
//
//                    if (newbuf !== num_widget.inputbuffer) {
//                        num_widget.inputbuffer = newbuf;
//                        num_widget.$('.value').text(this.inputbuffer);
//                    }
//                    num_widget.input_disc_program = false;
//                };
//            }


