/*  Copyright 2014-2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
    Copyright 2016 gaelTorrecillas <https://github.com/gaelTorrecillas>
    Copyright 2016 manawi <https://github.com/manawi>
    Copyright 2017 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
    Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_product_available.PosModel', function(require){
"use strict";

    var rpc = require('web.rpc');
    var models = require('point_of_sale.models');

    var PosModelSuper = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        load_server_data: function(){
            var self = this;

            var loaded = PosModelSuper.load_server_data.call(this);

            var prod_model = _.find(this.models, function(model){
                return model.model === 'product.product';
            });
            if (prod_model) {
                prod_model.fields.push('qty_available', 'type');
                var context_super = prod_model.context;
                prod_model.context = function(that){
                    var ret = context_super(that);
                    ret.location = that.config.stock_location_id[0];
                    return ret;
                };
                var loaded_super = prod_model.loaded;
                prod_model.loaded = function(that, products){
                    loaded_super(that, products);
                    self.db.product_qtys = products;
                };
                return loaded;
            }

            return loaded.then(function(){
                return rpc.query({
                        model: 'product.product',
                        method: 'search_read',
                        args: [],
                        fields: ['qty_available', 'type'],
                        domain: [['sale_ok','=',true],['available_in_pos','=',true]],
                        context: {'location': self.config.stock_location_id[0]},
                    }).then(function(products){
                        self.db.product_qtys = products;
                    });
            });
        },
        after_load_server_data: function() {
            var self = this;
            var res = PosModelSuper.after_load_server_data.apply(this, arguments);
            _.each(this.db.product_qtys, function(v){
                _.extend(self.db.get_product_by_id(v.id), v);
            });
            return res;
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
