(function(){

function pos(instance, module){
    var PosModelSuper = module.PosModel
    module.PosModel = module.PosModel.extend({
        load_server_data: function(){
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded = loaded.then(function(){
                return self.fetch(
                    'product.product',
                    ['is_lot', 'lot_qty', 'lot_product_id', 'lot_id'],
                    [['sale_ok','=',true],['available_in_pos','=',true]],
                    {}
                );
            }).then(function(products){
                $.each(products, function(){
                    $.extend(self.db.get_product_by_id(this.id) || {}, this)
                })
                return $.when()
            })
            return loaded;
        },
        scan_product: function(parsed_code){
            var self = this;
            var selectedOrder = this.get('selectedOrder');
            if(parsed_code.encoding === 'ean13'){
                var product = this.db.get_product_by_ean13(parsed_code.base_code);
            }else if(parsed_code.encoding === 'reference'){
                var product = this.db.get_product_by_reference(parsed_code.code);
            }

            if(!product){
                return false;
            }

            //added code
            if (product.lot_id){
                var lot_product = this.db.get_product_by_id(product.lot_id[0])
                if (lot_product.ean13==parsed_code.base_code)
                    //lot with same ean has priority
                    product = lot_product;
            }

            if(parsed_code.type === 'price'){
                selectedOrder.addProduct(product, {price:parsed_code.value});
            }else if(parsed_code.type === 'weight'){
                selectedOrder.addProduct(product, {quantity:parsed_code.value, merge:false});
            }else if(parsed_code.type === 'discount'){
                selectedOrder.addProduct(product, {discount:parsed_code.value, merge:false});
            }else{
                selectedOrder.addProduct(product);
            }
            return true;
        },

    })
}

var _super = window.openerp.point_of_sale;
window.openerp.point_of_sale = function(instance){
    _super(instance);
    var module = instance.point_of_sale;

    pos(instance, module);

    $('<link rel="stylesheet" href="/pos_product_lot/static/src/css/pos.css"/>').appendTo($("head"))
}

})()