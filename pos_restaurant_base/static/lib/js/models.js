odoo.define('pos_restaurant_base.models', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var multiprint = require('pos_restaurant.multiprint');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');

    var QWeb = core.qweb;


    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        computeChanges: function(categories, config){
            //  DIFFERENCES FROM ORIGINAL: 
            // * new incomming argument "config" (printer config)
            //   it's not used here, but may be used in extension 
            //   (yes, we know that declaration of config is not necessary here,
            //   but we'd like to do it to make code more readable)
            //
            // * new attributes in return: new_all and cancelled_all - lines without filtration with categories
            var current_res = this.build_line_resume();
            var old_res     = this.saved_resume || {};
            var json        = this.export_as_JSON();
            var add = [];
            var rem = [];
            var line_hash;

            for ( line_hash in current_res) {
                var curr = current_res[line_hash];
                var old  = old_res[line_hash];

                if (typeof old === 'undefined') {
                    add.push({
                        'id':       curr.product_id,
                        'name':     this.pos.db.get_product_by_id(curr.product_id).display_name,
                        'note':     curr.note,
                        'qty':      curr.qty,
                    });
                } else if (old.qty < curr.qty) {
                    add.push({
                        'id':       curr.product_id,
                        'name':     this.pos.db.get_product_by_id(curr.product_id).display_name,
                        'note':     curr.note,
                        'qty':      curr.qty - old.qty,
                    });
                } else if (old.qty > curr.qty) {
                    rem.push({
                        'id':       curr.product_id,
                        'name':     this.pos.db.get_product_by_id(curr.product_id).display_name,
                        'note':     curr.note,
                        'qty':      old.qty - curr.qty,
                    });
                }
            }

            for (line_hash in old_res) {
                if (typeof current_res[line_hash] === 'undefined') {
                    var old = old_res[line_hash];
                    rem.push({
                        'id':       old.product_id,
                        'name':     this.pos.db.get_product_by_id(old.product_id).display_name,
                        'note':     old.note,
                        'qty':      old.qty,
                    });
                }
            }

            var new_all = add;
            var cancelled_all = rem;

            if(categories && categories.length > 0){
                // filter the added and removed orders to only contains
                // products that belong to one of the categories supplied as a parameter

                var self = this;

                var _add = [];
                var _rem = [];

                for(var i = 0; i < add.length; i++){
                    if(self.pos.db.is_product_in_category(categories,add[i].id)){
                        _add.push(add[i]);
                    }
                }
                add = _add;

                for(var i = 0; i < rem.length; i++){
                    if(self.pos.db.is_product_in_category(categories,rem[i].id)){
                        _rem.push(rem[i]);
                    }
                }
                rem = _rem;
            }

            var d = new Date();
            var hours   = '' + d.getHours();
                hours   = hours.length < 2 ? ('0' + hours) : hours;
            var minutes = '' + d.getMinutes();
                minutes = minutes.length < 2 ? ('0' + minutes) : minutes;

            return {
                'new': add,
                'cancelled': rem,
                'new_all': new_all,
                'cancelled_all': cancelled_all,
                'table': json.table || false,
                'floor': json.floor || false,
                'name': json.name  || 'unknown order',
                'time': {
                    'hours':   hours,
                    'minutes': minutes,
                },
            };
        },
        printChanges: function(){
            var self = this;
            var printers = this.pos.printers;
            for(var i = 0; i < printers.length; i++){
                // DIFFERENCES FROM ORIGINAL: 
                // * call computeChanges with config
                var changes = this.computeChanges(printers[i].config.product_categories_ids, printers[i].config);

                // DIFFERENCES FROM ORIGINAL:
                // * move printing to a separate function
                this.print_order_receipt(printers[i], changes);
            }
        },
        print_order_receipt: function(printer, changes) {
            if ( changes['new'].length > 0 || changes['cancelled'].length > 0){
                var receipt = QWeb.render('OrderChangeReceipt',{changes:changes, widget:this});
                printer.print(receipt);
            }
        },
        hasChangesToPrint: function(){
            var printers = this.pos.printers;
            for(var i = 0; i < printers.length; i++){
                //  DIFFERENCES FROM ORIGINAL: call compute change with config
                var changes = this.computeChanges(printers[i].config.product_categories_ids, printers[i].config);
                if ( changes['new'].length > 0 || changes['cancelled'].length > 0){
                    return true;
                }
            }
            return false;
        },
    });
    return models;
});
