(function(){

function pos(instance, module){
    module.BarcodeReader.include({
        scan: function(code){
            if(code.length < 3){
                return;
            }else if(this.pos.db.get_product_by_reference(code)){
                var parse_result = {
                    encoding: 'reference',
                    type: 'product',
                    code: code,
                };
            }else if(code.length === 13 && this.check_ean(code)){
                var parse_result = this.parse_ean(code);
            }else if(code.length === 12 && this.check_ean('0'+code)){
                // many barcode scanners strip the leading zero of ean13 barcodes.
                // This is because ean-13 are UCP-A with an additional zero at the beginning,
                // so by stripping zeros you get retrocompatibility with UCP-A systems.
                var parse_result = this.parse_ean('0'+code);
            }else{
                var parse_result = {
                    encoding: 'error',
                    type: 'error',
                    code: code,
                };
            }

            if(parse_result.type in {'product':'', 'weight':'', 'price':'', 'discount':''}){    //ean is associated to a product
                if(this.action_callback.product){
                    this.action_callback.product(parse_result);
                }
            }else{
                if(this.action_callback[parse_result.type]){
                    this.action_callback[parse_result.type](parse_result);
                }
            }
        }
    });
}

var _super = window.openerp.point_of_sale;
window.openerp.point_of_sale = function(instance){
    _super(instance);
    var module = instance.point_of_sale;

    pos(instance, module);

    //$('<link rel="stylesheet" href="/pos_product_lot/static/src/css/pos.css"/>').appendTo($("head"))
};

})();