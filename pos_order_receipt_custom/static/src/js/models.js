/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */

odoo.define('pos_order_receipt_custom.models', function (require) {
    "use strict";

    var models = require('pos_restaurant_base.models');
    require('pos_receipt_custom.models')
    var core = require('web.core');

    var Qweb = core.qweb;

    models.load_fields('restaurant.printer',['custom_order_receipt', 'custom_order_receipt_id']);

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        // changes the current table.
        set_table: function(table) {
            var self = this;
            if (table && this.order_to_transfer_to_different_table && !this.order_to_transfer_to_different_table.first_order_printing && this.config.print_transfer_info_in_kitchen) {
                var old_table = this.order_to_transfer_to_different_table.table;
                var new_table = table;
                if (old_table.id !== new_table.id) {
                    var changes = {
                        'changes_table': true,
                        'old_table': old_table,
                        'new_table': new_table,
                        'name': this.order_to_transfer_to_different_table.name,
                        'new': [],
                        'cancelled': [],
                        'new_all': [],
                        'cancelled_all': [],
                    };

                    // For compatibility with the https://www.odoo.com/apps/modules/10.0/pos_order_note/ module
                    changes.order_note = this.order_to_transfer_to_different_table.note;
                    changes.order_custom_notes = this.order_to_transfer_to_different_table.custom_notes;


                    this.printers.forEach(function(printer) {
                        var products = self.get_order_product_list_of_printer(printer, self.order_to_transfer_to_different_table);
                        if (products && products.length) {
                            changes.products = products;
                            self.order_to_transfer_to_different_table.print_order_receipt(printer, changes);
                        }
                    });
                }
            }
            _super_posmodel.set_table.apply(this, arguments);
        },
        get_order_product_list_of_printer: function(printer, order) {
            var orderlines = order.get_orderlines();
            var lines = orderlines.filter(function(line) {
                if (_.contains(printer.config.product_categories_ids, line.product.pos_categ_id[0]) && line.mp_dirty === false) {
                    return true;
                }
            });
            var products = [];
            lines.forEach(function(line) {
                products.push({
                    'id':       line.product.id,
                    'name':     line.product.display_name,
                    'name_wrapped': line.generate_wrapped_product_name(),
                    'note':     line.note,
                    'custom_notes': line.custom_notes,
                    'qty':      line.quantity,
                    'line_id':  line.id,
                });
            });
            return products;
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function (session, attributes) {
            this.first_order_printing = true;
            return _super_order.initialize.apply(this, arguments);
        },
        print_order_receipt: function(printer, changes) {
            if (printer.config.custom_order_receipt && (changes['new'].length > 0 || changes['cancelled'].length > 0 || changes.changes_table)) {
                this.print_custom_receipt(printer, changes);
            } else {
                _super_order.print_order_receipt.apply(this,arguments);
                this.first_order_printing = false;
            }
        },
        print_custom_receipt: function(printer, changes) {
            // all order data
            changes.order = this.export_as_JSON();
            changes.waiter = this.pos.get_cashier();

            var d = new Date();
            var date = d.getDate();
            //January is 0
            var month = d.getMonth() + 1;
            var year = d.getFullYear();

            if (date < 10) {
                date = '0' + date;
            }

            if (month < 10) {
                month = '0' + month;
            }

            if (!changes.time) {
                var hours   = '' + d.getHours();
                    hours   = hours.length < 2 ? ('0' + hours) : hours;
                var minutes = '' + d.getMinutes();
                    minutes = minutes.length < 2 ? ('0' + minutes) : minutes;
                changes.time = {
                    'hours':   hours,
                    'minutes': minutes,
                };
            }

            changes.date = {'date': date, 'month': month, 'year':year};
            changes.printer = {'name': printer.config.name};

            var receipt_template = this.get_receipt_template_by_id(printer.config.custom_order_receipt_id[0], 'order_receipt');
            var template = $.parseXML(receipt_template.qweb_template).children[0];
            var receipt = this.custom_qweb_render(template, {changes:changes, widget:this});
            printer.print(receipt);
            this.first_order_printing = false;
        },
        export_as_JSON: function(){
            var json = _super_order.export_as_JSON.call(this);
            json.first_order_printing = this.first_order_printing;
            return json;
        },
        init_from_JSON: function(json) {
            _super_order.init_from_JSON.apply(this,arguments);
            this.first_order_printing = json.first_order_printing;
        },
    });

    return models;
});
