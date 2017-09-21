//odoo.define('pos_discount_absolute.pos_discount_absolute', function (require) {
//"use strict";
//
//    var screens = require('point_of_sale.screens');
//
////    models.load_models({
////        model: 'pos.config',
////        fields: ['discount_abs','discount_abs_value'],
////        loaded: function(self,abs_disc){
////            self.config = abs_disc;
////        },
////    });
//
//    var DiscountButton = screens.ActionButtonWidget.extend({
//        template: 'DiscountButton',
//        button_click: function(){
//            var self = this;
//            this.gui.show_popup('number',{
//                'title': 'Discount',
//                'value': this.pos.config.discount_pc,
//                'confirm': function(val) {
//                    val = Math.round(Math.max(0,Math.min(100,val)));
//                    self.apply_discount(val);
//                },
//            });
//        },
//
//        apply_discount: function(pc) {
//            var order    = this.pos.get_order();
//            var lines    = order.get_orderlines();
//            var product  = this.pos.db.get_product_by_id(this.pos.config.discount_product_id[0]);
//
//            // Remove existing discounts
//            var i = 0;
//            while ( i < lines.length ) {
//                if (lines[i].get_product() === product) {
//                    order.remove_orderline(lines[i]);
//                } else {
//                    i++;
//                }
//            }
//
//            // Add discount
//            var discount = - pc / 100.0 * order.get_total_with_tax();
//
//            if( discount < 0 ){
//                order.add_product(product, { price: discount });
//            }
//        },
//    });
//});
