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

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        get_discount_type: function() {
            var self = this;
            var model = new Model('pos.category_discount');
            var domain = [['discount_program_id', '=', id]];
            model.call('search_read', [domain]).then(function (resultat) {
                resultat.forEach(function(item){
                    self.apply_discount_category(item.category_discount_pc, item.discount_category_id[0], item.discount_program_id[1]);
                });
            });
        },
        apply_discount_category: function(discount, category_id, discount_program_name) {
            var self = this;
            var order = this.get_order();
            var lines = order.get_orderlines().filter(function (item) { return item.product.pos_categ_id[0] == category_id && item.product.discount_allowed; });
            lines.forEach(function (item){
                item.discount = discount;
                item.discountStr = discount;
                item.discount_program_name = discount_program_name;
                order.get_orderline(item.id).set_discount(discount);
            });
        },
    });

    PopupWidget.include({
        show: function (options) {
            var self = this;
            this._super(options);
            this.popup_abs_discount = false;
            if (this.pos.config.discount_abs_on) {
                self.popup_abs_discount = true;
//                self.events["click .discount-program-list .button"] = "click_discount_program";
            }
        },
        renderElement: function(){
            this._super();
            if (this.popup_abs_discount) {
                this.$('.popup.popup-number').addClass("popup-abs-discount");
                var header_buttons_html = QWeb.render('abs_disc_widget_header_buttons',{widget: this});
                var node = document.getElementByClassName("popup-input value active");
                node.insertBefore(header_buttons_html, node.childNodes[0])
            }
        },
    });
});
