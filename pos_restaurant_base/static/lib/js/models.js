odoo.define('pos_restaurant_base.models', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var multiprint = require('pos_restaurant.multiprint');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');

    var QWeb = core.qweb;


    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        build_line_resume: function(){
            var resume = {};
            var self = this;
            this.orderlines.each(function(line){
                if (line.mp_skip) {
                    return;
                }
                var line_hash = line.get_line_diff_hash();

                // DIFFERENCES FROM ORIGINAL:
                // * getting qty, note, product_id is moved to a separate function
                // * add line_id value
                var line_resume = self.get_line_resume(line);

                if (typeof resume[line_hash] === 'undefined') {
                    resume[line_hash] = line_resume;
                } else {
                    resume[line_hash].qty += line_resume.qty;
                }
            });
            return resume;
        },
        get_line_resume: function(line) {
            var qty  = Number(line.get_quantity());
            var note = line.get_note();
            var product_id = line.get_product().id;
            var product_name_wrapped = line.generate_wrapped_product_name();
            var line_id = line.id;
            return {qty: qty, note: note, product_id: product_id, product_name_wrapped: product_name_wrapped, line_id: line_id};
        },
        saveChanges: function(){
            var self = this;
            this.saved_resume = this.build_line_resume();

            function delay(ms) {
                var d = $.Deferred();
                setTimeout(function(){
                    d.resolve();
                }, ms);
                return d.promise();
            }

            var q = $.when();

            var lines = this.get_orderlines();
            lines.forEach(function(line, index){
                q = q.then(function(){
                    if (line.mp_dirty !== false) {
                        $('.order-scroller').scrollTop(133 * index);
                    }
                    line.set_dirty(false);
                    return delay(50);
                });
            });

            q.then(function(){
                self.trigger('change', self);
            });
        },
        computeChanges: function(categories, config){
            //  DIFFERENCES FROM ORIGINAL: 
            // * new incomming argument "config" (printer config)
            //   it's not used here, but may be used in extension 
            //   (yes, we know that declaration of config is not necessary here,
            //   but we'd like to do it to make code more readable)
            //
            // * new attributes in return: new_all and cancelled_all - lines without filtration with categories
            // * new attributes in return: line_id - id the changed line
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
                        'name_wrapped': curr.product_name_wrapped,
                        'note':     curr.note,
                        'qty':      curr.qty,
                        'line_id':  curr.line_id,
                    });
                } else if (old.qty < curr.qty) {
                    add.push({
                        'id':       curr.product_id,
                        'name':     this.pos.db.get_product_by_id(curr.product_id).display_name,
                        'name_wrapped': curr.product_name_wrapped,
                        'note':     curr.note,
                        'qty':      curr.qty - old.qty,
                        'line_id':  curr.line_id,
                    });
                } else if (old.qty > curr.qty) {
                    rem.push({
                        'id':       curr.product_id,
                        'name':     this.pos.db.get_product_by_id(curr.product_id).display_name,
                        'name_wrapped': curr.product_name_wrapped,
                        'note':     curr.note,
                        'qty':      old.qty - curr.qty,
                        'line_id':  curr.line_id,
                    });
                }
            }

            for (line_hash in old_res) {
                if (typeof current_res[line_hash] === 'undefined') {
                    var old = old_res[line_hash];
                    rem.push({
                        'id':       old.product_id,
                        'name':     this.pos.db.get_product_by_id(old.product_id).display_name,
                        'name_wrapped': old.product_name_wrapped,
                        'note':     old.note,
                        'qty':      old.qty,
                        'line_id':  old.line_id,
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
            var self = this;
            function delay(ms) {
                var d = $.Deferred();
                setTimeout(function(){
                    d.resolve();
                }, ms);
                return d.promise();
            }
            var q = $.when();
            if ( changes['new'].length > 0 || changes['cancelled'].length > 0){
                q = q.then(function(){
                    var receipt = QWeb.render('OrderChangeReceipt',{changes:changes, widget:this});
                    printer.print(receipt);
                    return delay(100);
                });
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
