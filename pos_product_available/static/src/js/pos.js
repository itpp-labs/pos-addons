odoo.define('pos_product_available.PosModel', function(require){
"use strict";


    var models = require('point_of_sale.models');
    var Model = require('web.DataModel');

    var PosModelSuper = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        load_server_data: function(){
            var self = this;
            var loaded = PosModelSuper.load_server_data.call(this);

            return loaded.then(function(){
                return new Model('product.product').query(['qty_available']).
                    filter([['sale_ok','=',true],['available_in_pos','=',true]]).
                    context({'location': self.config.stock_location_id[0]}).all().then(function(data){
                        _.each(data, function(pr){
                            self.db.get_product_by_id(pr.id).qty_available = pr.qty_available;
                        });
                    });
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
