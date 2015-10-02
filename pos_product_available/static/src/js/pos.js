function pos_product_available(instance, module){

    var PosModelSuper = module.PosModel
    module.PosModel = module.PosModel.extend({
        load_server_data: function(){
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded = loaded.then(function(){
                return self.fetch(
                    'product.product',
                    ['qty_available'],
                    [['sale_ok','=',true],['available_in_pos','=',true]],
                    {'location': self.config.stock_location_id[0]}
                );

            }).then(function(products){
                $.each(products, function(){
                    $.extend(self.db.get_product_by_id(this.id) || {}, this)
                });
                return $.when()
            })
            return loaded;
        },
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
                order.get('orderLines').each(function(line){
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
                if (order.get("orderLines")){
                    order.get("orderLines").each(function(line){
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
}

(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;

        pos_product_available(instance, module);

        $('<link rel="stylesheet" href="/pos_product_available/static/src/css/pos.css"/>').appendTo($("head"))
    }
})()
