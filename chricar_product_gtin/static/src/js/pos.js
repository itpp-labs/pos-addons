function chricar_product_gtin(instance, module){ //module is instance.point_of_sale
    module.BarcodeReader.include({
        ean_checksum: function(ean){
            if(ean.length !== 13){
                return -1;
            }
            return this.checksum(ean);
        },
        checksum: function(code){
            if (!code)
                return -1;
            code = code.split('')
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
        check_ean: function(eancode){
            if (!/^\d+$/.test(eancode))
                return false;
            if (this._super(eancode))
                return true;
            if ([8,12,13,14].indexOf(eancode.length) == -1)
                return false;
            var res = this.checksum(eancode) == parseInt(eancode.slice(-1));
            if (!res && eancode.length==8)
                res = this.checksum(this.convert_UPCE_to_UPCA(eancode)) == parseInt(eancode.slice(-1));
            return res

        },
        convert_UPCE_to_UPCA: function(upce_value){
            var middle_digits;
            if (upce_value.length==6)
                middle_digits=upce_value;
            else if (upce_value.length==7)
                middle_digits=upce_value.slice(0,6)
            else if(upce_value.length==8)
                middle_digits=upce_value.slice(1,7)
            else
                return false
            var d1=middle_digits[0];
            var d2=middle_digits[1];
            var d3=middle_digits[2];
            var d4=middle_digits[3];
            var d5=middle_digits[4];
            var d6=middle_digits[5];
            var mfrnum, itemnum;
            if (["0","1","2"].indexOf(d6) != -1){
                mfrnum=d1+d2+d6+"00"
                itemnum="00"+d3+d4+d5
            } else if (d6=="3"){
                mfrnum=d1+d2+d3+"00"
                itemnum="000"+d4+d5
            }else if (d6=="4"){
                mfrnum=d1+d2+d3+d4+"0"
                itemnum="0000"+d5
            }else{
                mfrnum=d1+d2+d3+d4+d5
                itemnum="0000"+d6
            }
            var newmsg="0"+mfrnum+itemnum;
            var check_digit=this.checksum(newmsg+'0')
            return newmsg+check_digit
        },
        parse_ean: function(ean){
            var self = this;
            var parse_result = {
                encoding: 'ean13',
                type:'error',
                code:ean,
                base_code: ean,
                value: 0,
            };

            if (!this.check_ean(ean)){
                return parse_result;
            }

            function is_number(char){
                n = char.charCodeAt(0);
                return n >= 48 && n <= 57;
            }

            function match_pattern(ean,pattern){
                for(var i = 0; i < pattern.length; i++){
                    var p = pattern[i];
                    var e = ean[i];
                    if( is_number(p) && p !== e ){
                        return false;
                    }
                }
                return true;
            }

            function get_value(ean,pattern){
                var value = 0;
                var decimals = 0;
                for(var i = 0; i < pattern.length; i++){
                    var p = pattern[i];
                    var v = parseInt(ean[i]);
                    if( p === 'N'){
                        value *= 10;
                        value += v;
                    }else if( p === 'D'){
                        decimals += 1;
                        value += v * Math.pow(10,-decimals);
                    }
                }
                return value;
            }

            function get_basecode(ean,pattern){
                var base = '';
                var max = Math.max(pattern.length, ean.length)
                for(var i = 0; i < max; i++){
                    var p = pattern[i];
                    var v = ean[i];
                    if (!v)
                        break;
                    if( !p || p === 'x'  || is_number(p)){
                        base += v;
                    }else{
                        base += '0';
                    }
                }
                if (base.length != 13)
                    return base;
                return self.sanitize_ean(base);
            }

            var patterns = this.sorted_patterns;

            for(var i = 0; i < patterns.length; i++){
                if(match_pattern(ean,patterns[i].pattern)){
                    parse_result.type  = patterns[i].type;
                    parse_result.value = get_value(ean,patterns[i].pattern);
                    parse_result.base_code = get_basecode(ean,patterns[i].pattern);
                    return parse_result;
                }
            }

            return parse_result;
        },
        scan: function(code){
            if(code.length < 3){
                return;
            }else if(this.check_ean(code)){
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
