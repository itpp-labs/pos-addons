/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License MIT (https://opensource.org/licenses/MIT). */

odoo.define("pos_receipt_custom_template.screens", function(require) {
    "use strict";
    var screens = require("point_of_sale.screens");

    screens.ReceiptScreenWidget.include({
        get_custom_receipt: function() {
            var display_time = false;
            if (this.pos.table) {
                var open_time =
                    this.pos.table.open_time || this.pos.get_current_datetime();
                var payment_time = this.pos.get_current_datetime();

                display_time = {time: open_time.time + "-" + payment_time.time};

                if (open_time.date === payment_time.date) {
                    display_time.date = open_time.date;
                } else {
                    display_time.date = open_time.date + "-" + payment_time.date;
                }
            }

            var order = this.pos.get_order();
            var env = {
                widget: this,
                pos: this.pos,
                order: order,
                receipt: order.export_for_printing(),
                paymentlines: order.get_paymentlines(),
                display_time: display_time,
            };
            var receipt_template = order.get_receipt_template_by_id(
                this.pos.config.custom_xml_receipt_id[0],
                "receipt"
            );
            var template = this.convert_to_xml(receipt_template.qweb_template);
            var receipt = order.custom_qweb_render(template, env);
            return receipt;
        },
        get_custom_ticket: function() {
            var display_time = false;
            if (this.pos.table) {
                var open_time =
                    this.pos.table.open_time || this.pos.get_current_datetime();
                var payment_time = this.pos.get_current_datetime();

                display_time = {time: open_time.time + "-" + payment_time.time};

                if (open_time.date === payment_time.date) {
                    display_time.date = open_time.date;
                } else {
                    display_time.date = open_time.date + "-" + payment_time.date;
                }
            }

            var order = this.pos.get_order();
            var ticket_template = order.get_receipt_template_by_id(
                this.pos.config.custom_ticket_id[0],
                "ticket"
            );
            var template = this.convert_to_xml(ticket_template.qweb_template);
            var ticket = order.custom_qweb_render(template, {
                widget: this,
                order: order,
                receipt: order.export_for_printing(),
                orderlines: order.get_orderlines(),
                paymentlines: order.get_paymentlines(),
                display_time: display_time,
            });
            return ticket;
        },
        render_receipt: function() {
            if (this.pos.config.custom_ticket) {
                var order = this.pos.get_order();
                var ticket = this.get_custom_ticket();
                this.$(".pos-receipt-container").html(ticket);
                if (this.pos.config.show_barcode_in_receipt) {
                    // For compatibility with pos_orders_history
                    var receipt_reference = order.uid;
                    this.$el
                        .find("#barcode")
                        .JsBarcode(receipt_reference, {format: "code128"});
                    this.$el.find("#barcode").css({
                        width: "100%",
                    });
                }
                if (this.save_order_receipt) {
                    // For compatibility with pos_orders_history_reprint
                    var template = this.convert_to_xml(ticket);
                    $(template)
                        .find(".receipt-type")
                        .html("(Supplement)");
                    ticket = template.outerHTML;
                    this.save_order_receipt(order, ticket, "ticket");
                }
            } else {
                this._super();
            }
        },
        print_xml: function() {
            if (this.pos.config.custom_xml_receipt) {
                var order = this.pos.get_order();
                var receipt = this.get_custom_receipt();
                if (this.pos.config.show_barcode_in_receipt) {
                    // For compatibility with pos_orders_history
                    var barcode = this.$el
                        .find("#barcode")
                        .parent()
                        .html();
                    if (barcode && receipt.indexOf('<img id="barcode"/>') !== -1) {
                        receipt = receipt.split('<img id="barcode"/>');
                        receipt[0] = receipt[0] + barcode + "</img>";
                        receipt = receipt.join("");
                    }
                }
                this.pos.proxy.print_receipt(receipt);
                order._printed = true;

                if (this.save_order_receipt) {
                    // For compatibility with pos_orders_history_reprint
                    var template = this.convert_to_xml(receipt);
                    $(template)
                        .find(".receipt-type")
                        .html("(Supplement)");
                    receipt = template.outerHTML;
                    this.save_order_receipt(order, receipt, "xml");
                }
                order.set_receipt_type(false);
            } else {
                this._super();
            }
        },
        convert_to_xml: function(template) {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(template, "text/xml");
            return xmlDoc.documentElement;
        },
    });

    return screens;
});
