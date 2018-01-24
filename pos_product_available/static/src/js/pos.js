odoo.define('pos_product_available.PosModel', function(require){
"use strict";


    var models = require('point_of_sale.models');
    var PosModelSuper = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            var self = this;
            models.load_fields('product.product',['qty_available']);
//  pos_cache caches 'product.product' model and removes it from the models, what leads to incorrect product quantity displaying.
//  for compatibility added a new 'product.product' model with the only field 'qty_available' to prevent incorrect displaying
            PosModelSuper.initialize.call(this, session, attributes);
            if (!_.find(this.models, function(model){
                return model.model === 'product.product';
            })){
                models.load_models({
                    model: 'product.product',
                    fields: ['qty_available'],
                    domain: [['sale_ok','=',true],['available_in_pos','=',true]],
                    loaded: function(_self, products){
                        self.product_quantities = products;
                    },
                });
            }
            this.ready.then(function () {
                if (self.product_quantities) {
                    _.each(self.product_quantities, function(prod){
                        _.extend(self.db.get_product_by_id(prod.id), prod);
                    });
                }
            });
        },
        refresh_qty_available:function(product){
            var $elem = $("[data-product-id='"+product.id+"'] .qty-tag");
            $elem.html(product.qty_available);
            if (product.qty_available <= 0 && !$elem.hasClass('not-available')){
                $elem.addClass('not-available');
            }
        },
        push_order: function(order, opts){
            var self = this;
            var pushed = PosModelSuper.push_order.call(this, order, opts);
            if (order){
                order.orderlines.each(function(line){
                    var product = line.get_product();
                    product.qty_available -= line.get_quantity();
                    self.refresh_qty_available(product);
                });
            }
            return pushed;
        },
        push_and_invoice_order: function(order){
            var self = this;
            var invoiced = PosModelSuper.push_and_invoice_order.call(this, order);

            if (order && order.get_client()){
                if (order.orderlines){
                    order.orderlines.each(function(line){
                        var product = line.get_product();
                        product.qty_available -= line.get_quantity();
                        self.refresh_qty_available(product);
                    });
                } else if (order.orderlines){
                    order.orderlines.each(function(line){
                        var product = line.get_product();
                        product.qty_available -= line.get_quantity();
                        self.refresh_qty_available(product);
                    });
                }
            }

            return invoiced;
        },
    });
});
