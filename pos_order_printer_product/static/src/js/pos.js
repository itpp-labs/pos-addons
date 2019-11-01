odoo.define('pos_order_printer_product', function(require){

    var models = require('pos_restaurant_base.models');

    models.load_fields('restaurant.printer', ['product_ids']);

    models.load_fields('restaurant.printer',['product_ids']);

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        is_product_in_product_list: function(id, list) {
            var product_tmpl_id = this.db.get_product_by_id(id).product_tmpl_id;
            if (Array.isArray(product_tmpl_id)) {
                product_tmpl_id = product_tmpl_id[0];
            }
            return $.inArray(product_tmpl_id, list) !== -1;
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        computeChanges: function(categories, config){
            var res = _super_order.computeChanges.apply(this, arguments);

            if (config && config.product_ids && config.product_ids.length) {
                var add = [];
                var rem = [];
                var i = 0;

                // filter the added and removed orders to only contains
                // products that belong the products list supplied as a parameter
                for(i = 0; i < res.new_all.length; i++){
                    if(this.pos.is_product_in_product_list(res.new_all[i].id, config.product_ids)){
                        add.push(res.new_all[i]);
                    }
                }

                for(i = 0; i < res.cancelled_all.length; i++){
                    if(this.pos.is_product_in_product_list(res.cancelled_all[i].id, config.product_ids)){
                        rem.push(res.cancelled_all[i]);
                    }
                }
                if (categories && categories.length) {
                    var _add = [];
                    var _rem = [];

                    add.forEach(function(item) {
                        var exist_new_change = res.new.find(function(element) {
                            return item.id === element.id;
                        });
                        if (!exist_new_change) {
                            _add.push(item);
                        }
                    });

                    rem.forEach(function(item) {
                        var exist_cancelled_change = res.cancelled.find(function(element) {
                            return item.id === element.id;
                        });
                        if (!exist_cancelled_change) {
                            _rem.push(item);
                        }
                    });
                    res.new = res.new.concat(_add);
                    res.cancelled = res.cancelled.concat(_rem);
                } else {
                    res.new = add;
                    res.cancelled = rem;
                }
            }

            return res;
        },
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        //  can this orderline be potentially printed ?
        printable: function() {
            var printers = this.pos.printers;
            var all_printers_product_list = [];
            printers.forEach(function(printer){
                all_printers_product_list = all_printers_product_list.concat(printer.config.product_ids);
            });
            var printable = this.pos.is_product_in_product_list(this.get_product().id, all_printers_product_list);
            return _super_orderline.printable.apply(this,arguments) || printable;
        },
    });

    return models;
});
