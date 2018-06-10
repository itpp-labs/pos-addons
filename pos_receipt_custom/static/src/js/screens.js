/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */

odoo.define('pos_receipt_custom.screens', function(require){

    var models = require('pos_receipt_custom.models');
    var screens = require('point_of_sale.screens');

    screens.ReceiptScreenWidget.include({
        render_receipt: function(){
            if (this.pos.config.custom_ticket) {

                if (this.pos.table) {
                    var open_time = this.pos.table.open_time;
                    var payment_time = this.pos.get_current_datetime();

                    var display_time = {time: open_time.time + "-" + payment_time.time};

                    if (open_time.date === payment_time.date) {
                        display_time.date = open_time.date;
                    } else {
                        display_time.date = open_time.date + "-" + payment_time.date;
                    }
                }

                var order = this.pos.get_order();
                var ticket_template = order.get_receipt_template_by_id(this.pos.config.custom_ticket_id[0], 'ticket');
                var template = $.parseXML(ticket_template.qweb_template).children[0];
                var ticket = order.custom_qweb_render(template, {
                    widget: this,
                    order: order,
                    receipt: order.export_for_printing(),
                    orderlines: order.get_orderlines(),
                    paymentlines: order.get_paymentlines(),
                    display_time: display_time || false,
                });
                this.$('.pos-receipt-container').html(ticket);
            } else {
                this._super();
            }
        },
        print_xml: function() {
            if (this.pos.config.custom_xml_receipt) {

                if (this.pos.table) {
                    var open_time = this.pos.table.open_time;
                    var payment_time = this.pos.get_current_datetime();

                    var display_time = {time: open_time.time + "-" + payment_time.time};

                    if (open_time.date === payment_time.date) {
                        display_time.date = open_time.date;
                    } else {
                        display_time.date = open_time.date + "-" + payment_time.date;
                    }
                }

                var order = this.pos.get_order();
                var env = {
                    widget:  this,
                    pos: this.pos,
                    order: order,
                    receipt: order.export_for_printing(),
                    paymentlines: order.get_paymentlines(),
                    display_time: display_time || false,
                };

                var receipt_template = order.get_receipt_template_by_id(this.pos.config.custom_xml_receipt_id[0], 'receipt');
                var template = $.parseXML(receipt_template.qweb_template).children[0];
                var receipt = order.custom_qweb_render(template, env);
                this.pos.proxy.print_receipt(receipt);
                order._printed = true;
                order.set_receipt_type(false);
            } else {
                this._super();
            }
        },
    });

    return screens;
});
