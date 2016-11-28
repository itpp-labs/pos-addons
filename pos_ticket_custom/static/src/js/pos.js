function pos_ticket_custom(instance, module){

    function sequence_next(seq){
        var idict = {
            'year': moment().format('YYYY'),
            'month': moment().format('MM'),
            'day': moment().format('DD'),
            'y': moment().format('YY')
            //'doy': moment().format('%j'),
            //'woy': moment().format('%W'),
            //'weekday': moment().format('%w'),
            //'h24': moment().format('%H'),
            //'h12': moment().format('%I'),
            //'min': moment().format('%M'),
            //'sec': moment().format('%S'),
        };
        var format = function(s, dict){
            s = s || '';
            $.each(dict, function(k, v){
                s = s.replace('%('+k+')s', v);
            });
            return s;
        };
        function pad(n, width, z) {
            z = z || '0';
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        }
        var num = seq.number_next_actual;
        seq.number_next_actual += seq.number_increment;

        return format(seq.prefix, idict) + pad(num, seq.padding) + format(seq.suffix, idict);
    }

    var round_di = instance.web.round_decimals;
    var round_pr = instance.web.round_precision;

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        load_server_data: function(){
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded = loaded.then(function(){
                return self.fetch(
                    'ir.sequence',
                    [],
                    [['id','=',self.config.pos_order_sequence_id[0]]],
                    {}
                );

            }).then(function(sequence){
                self.config.pos_order_sequence = sequence[0];

                return self.fetch('res.currency',['name', 'symbol','position','rounding','accuracy'],[['id','=',self.pricelist.currency_id[0]]]);
            }).then(function(currencies){
                self.currency = currencies[0];
                if (self.currency.rounding > 0) {
                    self.currency.decimals = Math.ceil(Math.log(1.0 / self.currency.rounding) / Math.log(10));
                } else {
                    self.currency.decimals = 0;
                }

                return $.when();
            });
            return loaded;
        },
        push_order: function(order){
            var currentOrder = this.get('selectedOrder');

            var name_custom = sequence_next(this.config.pos_order_sequence);

            currentOrder.set({'name_custom': name_custom});

            var pushed = PosModelSuper.prototype.push_order.call(this, order);
            return pushed;
        }
    });


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
            });

            res.tax_name = tax_name.join(',');

            var currency_rounding = this.pos.currency.rounding;
            res.price_without_discount = round_pr(this.get_quantity() * this.get_unit_price(), currency_rounding);

            return res;
        }
    });


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
                };
            }
            res.client_data = client_data;

            res.tax_details_extra = this.getTaxDetailsExtra();

            res.name_custom = this.get('name_custom');

            return res;
        },
        export_as_JSON:function(){
            var res = ModuleOrderSuper.prototype.export_as_JSON.call(this);

            res.seq_number_next_actual =  this.pos.config.pos_order_sequence.number_next_actual;

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
    });
}

(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;

        pos_ticket_custom(instance, module);

        //$('<link rel="stylesheet" href="/pos_ticket_custom/static/src/css/pos.css"/>').appendTo($("head"))
    };
})();
