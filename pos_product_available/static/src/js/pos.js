function pos_product_available(instance, module){

    var PosModelSuper = module.PosModel
    module.PosModel = module.PosModel.extend({
        load_server_data: function(){
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded = loaded.then(function(){
                return self.fetch(
                    'product.product',
                    ['name', 'list_price','price','public_categ_id', 'taxes_id', 'ean13', 'default_code', 'variants',
                     'qty_available',
                     'to_weight', 'uom_id', 'uos_id', 'uos_coeff', 'mes_type', 'description_sale', 'description'],
                    [['sale_ok','=',true],['available_in_pos','=',true]],
                    {pricelist: self.pricelist.id} // context for price
                );

            }).then(function(products){
                self.db.add_products(products);
                return $.when()
            })
            return loaded;
        },
        push_order: function(order){
            var self = this;
            var pushed = PosModelSuper.prototype.push_order.call(this, order);
            order.get('orderLines').each(function(line){
                var product = line.get_product();
                product.qty_available -= line.get_quantity();
                var $elem = $("[data-product-id='"+product.id+"'] .qty-tag");
                $elem.html(product.qty_available)
                if (product.qty_available <= 0 && !$elem.hasClass('not-available')){
                    $elem.addClass('not-available')
                }
            })
        }
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