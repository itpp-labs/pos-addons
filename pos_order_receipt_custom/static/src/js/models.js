/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */

odoo.define('pos_order_receipt_custom.models', function (require) {
    "use strict";

    var models = require('pos_restaurant_base.models');
    require('pos_receipt_custom_template.models');
    var core = require('web.core');

    var Qweb = core.qweb;

    models.load_fields('restaurant.printer',['custom_order_receipt', 'custom_order_receipt_id']);

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var receipt_model = _.find(this.models, function(model) {
                return model.model === 'pos.custom_receipt';
            });
            // update domain
            receipt_model.domain = function(self) {
                var domain = [];
                var type = [];
                if (self.config.custom_ticket) {
                    type.push('ticket');
                }
                if (self.config.custom_xml_receipt) {
                    type.push('receipt');
                }
                if (self.config.custom_kitchen_receipt) {
                    type.push('order_receipt');
                }
                domain.push(['type','in',type]);
                return domain;
            };
            // update condition
            receipt_model.condition = function(self) {
                return self.config.custom_ticket || self.config.custom_xml_receipt || self.config.custom_kitchen_receipt;
            };
            _super_posmodel.initialize.apply(this, arguments);
        },
        transfer_order_to_different_table: function () {
            this.order_to_transfer_to_different_table = this.get_order();
            if (this.order_to_transfer_to_different_table) {
                this.order_to_transfer_to_different_table.printed_transfer = false;
            }
            _super_posmodel.transfer_order_to_different_table.apply(this, arguments);
        },
        // changes the current table.
        set_table: function(table) {
            var order = this.order_to_transfer_to_different_table;
            if (table && order && !order.first_order_printing && this.config.print_transfer_info_in_kitchen && !order.printed_transfer) {
                this.print_transfer_order(this.order_to_transfer_to_different_table, order.table, table);
            }
            _super_posmodel.set_table.apply(this, arguments);
        },
        print_transfer_order: function(order, old_table, new_table) {
            var self = this;
            if (old_table.id !== new_table.id) {
                var changes = {
                    'changes_table': true,
                    'old_table': old_table,
                    'new_table': new_table,
                    'name': order.name,
                    'new': [],
                    'cancelled': [],
                    'new_all': [],
                    'cancelled_all': [],
                };

                // For compatibility with the https://www.odoo.com/apps/modules/10.0/pos_order_note/ module
                changes.order_note = order.note;
                changes.order_custom_notes = order.custom_notes;

                this.printers.forEach(function(printer) {
                    var products = self.get_order_product_list_of_printer(printer, order);
                    if (products && products.length) {
                        changes.products = products;
                        order.print_order_receipt(printer, changes);
                        order.printed_transfer = true;
                        order.trigger('change', order);
                        // For compatibility with the https://www.odoo.com/apps/modules/10.0/pos_multi_session/ module
                        setTimeout(function() {
                            order.trigger('new_updates_to_send');
                        }, 0);
                    }
                });
            }
        },
        get_order_product_list_of_printer: function(printer, order) {
            var self = this;
            var orderlines = order.get_orderlines();
            var lines = orderlines.filter(function(line) {
                // for compatibility with pos_category_multi
                if (line.product.pos_category_ids && line.product.pos_category_ids.length && line.mp_dirty === false) {
                    var res = printer.config.product_categories_ids.filter(function(cat) {
                        return line.product.pos_category_ids.indexOf(cat) !== -1;
                    });
                    if (res && res.length) {
                        return true;
                    }
                }
                // for compatibility with pos_order_printer_product
                if(self.is_product_in_product_list && self.is_product_in_product_list(line.product.id, printer.config.product_ids) && line.mp_dirty === false) {
                    return true;
                }
                if (line.product.pos_categ_id && _.contains(printer.config.product_categories_ids, line.product.pos_categ_id[0]) && line.mp_dirty === false) {
                    return true;
                }
                return false;
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
                    'unit':     line.get_unit().name,
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
            if (printer.config.custom_order_receipt && (changes.new.length > 0 || changes.cancelled.length > 0 || changes.changes_table)) {
                this.print_custom_receipt(printer, changes);
            } else {
                _super_order.print_order_receipt.apply(this,arguments);
                this.first_order_printing = false;
            }
        },
        get_custom_order_receipt: function(printer, changes) {
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
                var hours = String(d.getHours());
                if (hours.length < 2) {
                    hours = '0' + hours;
                }
                var minutes = String(d.getMinutes());
                if (minutes.length < 2) {
                    minutes = '0' + minutes;
                }

                changes.time = {
                    'hours':   hours,
                    'minutes': minutes,
                };
            }

            changes.date = {'date': date, 'month': month, 'year':year};
            changes.printer = {'name': printer.config.name};

            var receipt_template = this.get_receipt_template_by_id(printer.config.custom_order_receipt_id[0], 'order_receipt');
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(receipt_template.qweb_template, "text/xml");

            var receipt = this.custom_qweb_render(xmlDoc.documentElement, {changes:changes, widget:this});
            return receipt;
        },
        print_custom_receipt: function(printer, changes) {
            var receipt = this.get_custom_order_receipt(printer, changes);
            printer.print(receipt);
            this.first_order_printing = false;
        },
        get_custom_notes_as_string: function(notes) {
            var str_notes = '';
            notes.forEach(function(note, index){
                str_notes += note.name;
                if (index + 1 !== notes.length) {
                    str_notes += ', ';
                }
            });
            return str_notes;
        },
        get_string_array_by_len: function(len, str, s) {
            //  len - the maximum number of characters
            //  str - text to be divided
            //  s - division symbol (default value  ' ')
            s = s || ' ';
            var temp = "";
            var arr = [];
            var temp_arr = [];
            str = str.split(s);
            str.forEach(function(item, index) {
                temp += item+' ';
                if (temp.length <= len) {
                    temp_arr.push(item);
                } else {
                    arr.push(temp_arr.join(" "));
                    temp_arr = [];
                    temp = item;
                    temp_arr.push(item);
                }
                if (index + 1 === str.length && temp_arr.length) {
                    arr.push(temp_arr.join(" "));
                }
            });
            return arr;
        },
        export_as_JSON: function(){
            var json = _super_order.export_as_JSON.call(this);
            json.first_order_printing = this.first_order_printing;
            json.table_open_time = false;
            json.printed_transfer = this.printed_transfer;
            if (this.table) {
                json.table_open_time = this.table.open_time;
            }
            return json;
        },
        init_from_JSON: function(json) {
            _super_order.init_from_JSON.apply(this,arguments);
            this.printed_transfer = json.printed_transfer;
            if (this.table) {
                this.table.open_time = json.table_open_time || json.create_date;
            }
            this.first_order_printing = json.first_order_printing;
        },
        // This function is used to sync data accross all POSes
        // (only when pos_multi_session is installed)
        apply_ms_data: function(data) {
            if (_super_order.apply_ms_data) {
                _super_order.apply_ms_data.apply(this, arguments);
            }
            if (this.table) {
                this.table.open_time = data.table_open_time;
            }
            this.first_order_printing = data.first_order_printing;
            this.printed_transfer = data.printed_transfer;
        },
    });

    return models;
});
