function chricar_product_gtin(instance, module){ //module is instance.point_of_sale
    module.BarcodeReader.include({
        ean_checksum: function(ean){
            var code = ean.split('');
            if(code.length !== 13){
                return -1;
            }
            var oddsum = 0, evensum = 0, total = 0;
            code = code.reverse().splice(1);
            for(var i = 0; i < code.length; i++){
                if(i % 2 == 0){
                    oddsum += Number(code[i]);
                }else{
                    evensum += Number(code[i]);
                }
            }
            total = oddsum * 3 + evensum;
            return Number((10 - total % 10) % 10);
        },
        scan: function(code){
            if(code.length < 3){
                return;
            }else if(code.length === 13 && this.check_ean(code)){
                var parse_result = this.parse_ean(code);
            }else if(code.length === 12 && this.check_ean('0'+code)){
                // many barcode scanners strip the leading zero of ean13 barcodes.
                // This is because ean-13 are UCP-A with an additional zero at the beginning,
                // so by stripping zeros you get retrocompatibility with UCP-A systems.
                var parse_result = this.parse_ean('0'+code);
            }else if(this.pos.db.get_product_by_reference(code)){
                var parse_result = {
                    encoding: 'reference',
                    type: 'product',
                    code: code,
                };
            }else{
                var parse_result = {
                    encoding: 'error',
                    type: 'error',
                    code: code,
                };
            }

            if(parse_result.type in {'product':'', 'weight':'', 'price':'', 'discount':''}){    //ean is associated to a product
                if(this.action_callback['product']){
                    this.action_callback['product'](parse_result);
                }
            }else{
                if(this.action_callback[parse_result.type]){
                    this.action_callback[parse_result.type](parse_result);
                }
            }
        }
    })
}



(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;
        chricar_product_gtin(instance, module);
    }

    //$('<link rel="stylesheet" href="/product_barcode/static/src/css/pos.css"/>').appendTo($("head"))

})()
