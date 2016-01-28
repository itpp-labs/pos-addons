odoo.define('pos_product_available.PosModel', function(require){
"use strict";


    var models = require('point_of_sale.models');
    models.load_models({
        model: 'product.product',
        fields: ['qty_available'],
        domain:[['sale_ok','=',true],['available_in_pos','=',true]],
        context: function(self){ return {'location': self.config.stock_location_id[0]}},
        loaded: function(self, products){
            $.each(products, function(){
                $.extend(self.db.get_product_by_id(this.id) || {}, this)
            });
        }
    })

    var PosModelSuper = models.PosModel;

    models.PosModel = models.PosModel.extend({
        refresh_qty_available:function(product){
            var $elem = $("[data-product-id='"+product.id+"'] .qty-tag");
            $elem.html(product.qty_available)
            if (product.qty_available <= 0 && !$elem.hasClass('not-available')){
                $elem.addClass('not-available')
            }
        },
        push_order: function(order){
            var self = this;
            var pushed = PosModelSuper.prototype.push_order.call(this, order);
            if (order){
                order.orderlines.each(function(line){
                    var product = line.get_product();
                    product.qty_available -= line.get_quantity();
                    self.refresh_qty_available(product);
                })
            }
            return pushed;
        },
        push_and_invoice_order: function(order){
            var self = this;
            var invoiced = PosModelSuper.prototype.push_and_invoice_order.call(this, order);

            if (order && order.get_client()){
                if (order.orderlines){
                    order.orderlines.each(function(line){
                        var product = line.get_product();
                        product.qty_available -= line.get_quantity();
                        self.refresh_qty_available(product);
                    })
                } else if (order.orderlines){
                    order.orderlines.each(function(line){
                        var product = line.get_product();
                        product.qty_available -= line.get_quantity();
                        self.refresh_qty_available(product);
                    })
                }
            }

            return invoiced;
        },
    })
})
