/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */

odoo.define('pos_receipt_custom.screens', function(require){

    var models = require('pos_receipt_custom.models');
    var screens = require('point_of_sale.screens');

    screens.ReceiptScreenWidget.include({
        get_custom_receipt: function(){
            if (this.pos.table) {
                var open_time = this.pos.table.open_time || this.pos.get_current_datetime();
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
            return receipt;
        },
        get_custom_ticket: function(){
            if (this.pos.table) {
                var open_time = this.pos.table.open_time || this.pos.get_current_datetime();
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
            return ticket;
        },
        render_receipt: function(){
            if (this.pos.config.custom_ticket) {
                var order = this.pos.get_order();
                var ticket = this.get_custom_ticket();
                this.$('.pos-receipt-container').html(ticket);
                // for compatibility with pos_orders_history_reprint
                if (this.save_order_receipt) {
                    var template = $.parseXML(ticket).children[0];
                    $(template).find(".receipt-type").html("(Supplement)");
                    ticket = template.outerHTML;
                    this.save_order_receipt(order, ticket, 'ticket');
                }
            } else {
                this._super();
            }
        },
        print_xml: function() {
            if (this.pos.config.custom_xml_receipt) {
                var order = this.pos.get_order();
                var receipt = this.get_custom_receipt();
                this.pos.proxy.print_receipt(receipt);
                order._printed = true;

                // for compatibility with pos_orders_history_reprint
                if (this.save_order_receipt) {
                    var template = $.parseXML(receipt).children[0];
                    $(template).find(".receipt-type").html("(Supplement)");
                    receipt = template.outerHTML;
                    this.save_order_receipt(order, receipt, 'xml');
                }
                order.set_receipt_type(false);
            } else {
                this._super();
            }
        },
    });

    return screens;
});
