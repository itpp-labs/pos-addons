function pos_ticket_custom(instance, module){

    var round_di = instance.web.round_decimals;
    var round_pr = instance.web.round_precision

    var ModuleOrderlineSuper = module.Orderline;
    module.Orderline = module.Orderline.extend({
        export_for_printing:function(){
            var res = ModuleOrderlineSuper.prototype.export_for_printing.call(this);

            var product =  this.get_product();
            var taxes_ids = product.taxes_id;
            var taxes =  this.pos.taxes;

            var tax_name = [];

            _.each(taxes_ids, function(el) {
                var tax = _.detect(taxes, function(t) {return t.id === el;});
                tax_name.push(tax.name);
            })

            res.tax_name = tax_name.join(',')

            var currency_rounding = this.pos.currency.rounding;
            res.price_without_discount = round_pr(this.get_quantity() * this.get_unit_price(), currency_rounding);

            return res;
        }
    })


    var ModuleOrderSuper = module.Order;
    module.Order = module.Order.extend({
        export_for_printing:function(){
            var res = ModuleOrderSuper.prototype.export_for_printing.call(this);

            var client  = this.get('client');
            var client_data = {};
            if (client){
                var address = '' + (client.zip?client.zip + ' ' : '') + (client.street?client.street + ' ' : '') + (client.city?client.city +' ' : '') + (client.country_id?client.country_id[1] +' ' : '') ;

                client_data = {
                    address: address,
                    tax_id: ''
                }
            }
            res.client_data = client_data;

            res.tax_details_extra = this.getTaxDetailsExtra();

            return res;
        },
        getTaxDetailsExtra:function(){
            var details = {};
            var detailsTaxBase = {};
            var fulldetails = [];
            var taxes_by_id = {};

            for(var i = 0; i < this.pos.taxes.length; i++){
                taxes_by_id[this.pos.taxes[i].id] = this.pos.taxes[i];
            }

            this.get('orderLines').each(function(line){
                var lprices = line.get_all_prices();
                var ldetails = lprices.taxDetails;
                for(var id in ldetails){
                    if(ldetails.hasOwnProperty(id)){
                        details[id] = (details[id] || 0) + ldetails[id];

                        //we use only products with single tax!!!
                        detailsTaxBase[id] = (detailsTaxBase[id] || 0) + lprices.priceWithoutTax;
                    }
                }
            });

            for(var id in details){
                if(details.hasOwnProperty(id)){
                    fulldetails.push({amount: details[id], name:taxes_by_id[id].name, base:detailsTaxBase[id]});
                }
            }

            return fulldetails;
        }
    })
}

(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;

        pos_ticket_custom(instance, module);

        //$('<link rel="stylesheet" href="/pos_ticket_custom/static/src/css/pos.css"/>').appendTo($("head"))
    }
})()
