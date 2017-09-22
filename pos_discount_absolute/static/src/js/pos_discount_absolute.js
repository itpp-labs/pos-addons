odoo.define('pos_discount_absolute', function (require) {
"use strict";

    var models = require('point_of_sale.models');
    var gui = require('point_of_sale.gui');
    var Widget = require('web.Widget');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var PopupWidget = require('point_of_sale.popups');
    var core = require('web.core');

    var QWeb = core.qweb;


    PosBaseWidget.include({
        init:function(parent,options){
            var self = this;
            this._super(parent,options);
            if (this.gui && this.gui.screen_instances.products &&
                this.gui.screen_instances.products.action_buttons.discount && this.pos.config.discount_abs_on) {
                var disc_widget = this.gui.screen_instances.products.action_buttons.discount;
                disc_widget.button_click = function () {
                    self.gui.show_popup('number', {
                        'title': 'Absolute Discount',
                        'value': self.pos.config.discount_abs_value,
                        'confirm': function (val) {
                            self.apply_abs_discount(val);
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
            if (this.pos.config.discount_abs_type){
                var discount = - Math.min(val, order.get_total_with_tax());
                order.add_product(product, { price: discount });
            } else {
                var discount = - val / 100.0 * order.get_total_with_tax();
                if( discount < 0 ){
                    order.add_product(product, { price: discount });
                }
            }
        },
    });

    PopupWidget.include({
        show: function (options) {
            var self = this;
            this._super(options);
            this.popup_abs_discount = false;
            if (this.pos.config.discount_abs_on) {
                self.popup_abs_discount = true;
                self.events["click .absolute.button"] = "click_absolute_discount";
                self.events["click .percentage.button"] = "click_percentage_discount";
            }
        },
        click_absolute_discount: function() {
            var self = this;
            this.pos.config.discount_abs_type = true;
            this.renderElement();
        },
        click_percentage_discount: function() {
            var self = this;
            this.pos.config.discount_abs_type = false;
            this.renderElement();
        },
        renderElement: function(){
            this._super();
            if (this.popup_abs_discount) {
                this.$('.popup.popup-number').addClass("popup-abs-discount");
                var header_buttons_html = QWeb.render('abs_disc_widget_header_buttons',{widget: this});
                var node = document.getElementsByClassName("popup-input value active")[0];
                var div = document.createElement('div');
                div.innerHTML = header_buttons_html;
                div.className = "header";
                node.parentElement.insertBefore(div, node);
                var header_title = node.parentElement.getElementsByClassName("title")[0];
                var text = this.pos.config.discount_abs_type && "Absolute Discount" || "Discount Percentage"
                header_title.innerText = text;
            }
        },
    });
});
