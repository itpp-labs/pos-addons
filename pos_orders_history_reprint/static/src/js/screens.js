/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Artem Losev
 * Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_orders_history_reprint.screens", function(require) {
    "use strict";

    var gui = require("point_of_sale.gui");
    var screens = require("pos_orders_history.screens");
    var core = require("web.core");
    var Model = require("web.Model");

    var QWeb = core.qweb;
    var _t = core._t;

    screens.ReceiptScreenWidget.include({
        print_xml: function() {
            this._super();
            var order = this.pos.get_order();
            var env = {
                widget: this,
                pos: this.pos,
                order: order,
                receipt: order.export_for_printing(),
                paymentlines: order.get_paymentlines(),
            };
            var receipt = QWeb.render("XmlReceipt", env);
            this.save_order_receipt(order, receipt, "xml");
        },
        save_order_receipt: function(order, receipt, receipt_type) {
            var name = order.name;
            new Model("pos.xml_receipt")
                .call("save_xml_receipt", [[], name, receipt, receipt_type])
                .then(function(result) {
                    console.log(receipt_type, " receipt has been saved.");
                });
        },
        render_receipt: function() {
            this._super();
            var order = this.pos.get_order();
            var env = {
                widget: this,
                order: order,
                receipt: order.export_for_printing(),
                orderlines: order.get_orderlines(),
                paymentlines: order.get_paymentlines(),
            };
            var ticket = QWeb.render("PosTicket", env);
            this.save_order_receipt(order, ticket, "ticket");
        },
    });

    screens.OrdersHistoryScreenWidget.include({
        show: function() {
            this._super();
            if (this.pos.config.reprint_orders) {
                this.set_reprint_action();
            }
        },
        set_reprint_action: function() {
            var self = this;
            this.$(".actions.oe_hidden").removeClass("oe_hidden");
            this.$(".button.reprint").unbind("click");
            this.$(".button.reprint").click(function(e) {
                var parent = $(this).parents(".order-line");
                var id = parseInt(parent.data("id"), 10);
                self.click_reprint_order(id);
            });
        },
        click_reprint_order: function(id) {
            this.gui.show_screen("reprint_receipt", {order_id: id});
        },
        render_list: function(orders) {
            this._super(orders);
            if (this.pos.config.reprint_orders) {
                this.set_reprint_action();
            }
        },
    });

    screens.ReprintReceiptScreenWidget = screens.ReceiptScreenWidget.extend({
        template: "ReprintReceiptScreenWidget",
        show: function() {
            var self = this;
            this.reprint_receipt = false;
            this._super();
            this.$(".back").click(function() {
                self.gui.show_screen("orders_history_screen");
            });
        },
        get_order: function() {
            var order_id = this.gui.get_current_screen_param("order_id");
            return this.pos.db.orders_history_by_id[order_id];
        },
        handle_auto_print: function() {
            var self = this;
            var order = this.get_order();
            this.$(".pos-sale-ticket").hide();
            var receipt = this.pos.get_receipt_by_order_reference_and_type(
                order.pos_reference,
                "xml"
            );
            if (receipt) {
                self.$(".pos-sale-ticket").show();
                self.reprint_receipt = receipt;
                self.check_handle_auto_print();
            } else {
                new Model("pos.xml_receipt")
                    .call("search_read", [
                        [
                            ["pos_reference", "=", order.pos_reference],
                            ["receipt_type", "=", "xml"],
                        ],
                    ])
                    .then(
                        function(r) {
                            self.$(".pos-sale-ticket").show();
                            self.reprint_receipt = r;
                            self.check_handle_auto_print();
                        },
                        function() {
                            self.show_popup = true;
                            self.click_next();
                        }
                    );
            }
        },
        check_handle_auto_print: function() {
            if (
                this.should_auto_print() &&
                this.reprint_receipt &&
                this.reprint_receipt.length
            ) {
                this.print();
                if (this.should_close_immediately()) {
                    this.click_next();
                }
            } else {
                this.lock_screen(false);
            }
        },
        print_xml: function(receipt_arg) {
            var self = this;
            this.show_popup = false;
            var order = this.get_order();
            var receipt = null;
            if (receipt_arg) {
                receipt = receipt_arg.receipt;
                if (this.pos.config.show_barcode_in_receipt) {
                    var barcode = this.$el
                        .find("#barcode")
                        .parent()
                        .html();
                    if (!barcode) {
                        var receipt_reference =
                            order.pos_reference &&
                            order.pos_reference.match(/\d{1,}-\d{1,}-\d{1,}/g) &&
                            order.pos_reference.match(/\d{1,}-\d{1,}-\d{1,}/g)[0];
                        var el = document.createElement("div");
                        $(el).append("<img id='barcode'></img>");
                        $(el)
                            .find("#barcode")
                            .JsBarcode(receipt_reference, {format: "code128"});
                        $(el)
                            .find("#barcode")
                            .css({
                                width: "100%",
                            });
                        barcode = $(el)
                            .find("#barcode")
                            .parent()
                            .html();
                    }
                    if (receipt.indexOf('<img id="barcode"/>') !== -1) {
                        receipt = receipt.split('<img id="barcode"/>');
                        receipt[0] = receipt[0] + barcode + "</img>";
                        receipt = receipt.join("");
                    }
                }
                this.pos.proxy.print_receipt(receipt);
            } else if (self.pos.config.show_posted_orders && order.state === "done") {
                if (self.reprint_receipt && self.reprint_receipt.length) {
                    self.print_xml(self.reprint_receipt[0]);
                } else {
                    self.show_popup = true;
                    self.click_next();
                }
            } else {
                receipt = this.pos.get_receipt_by_order_reference_and_type(
                    order.pos_reference,
                    "xml"
                );
                if (receipt) {
                    this.print_xml(receipt);
                } else {
                    this.show_popup = true;
                    self.click_next();
                }
            }
        },
        click_next: function() {
            this.gui.show_screen("orders_history_screen");
            if (this.show_popup) {
                this.gui.show_popup("error", {
                    title: _t("No XML Receipt."),
                    body: _t("There is no XML receipt for the order."),
                });
            }
        },
        print_web: function() {
            window.print();
        },
        render_receipt: function(ticket) {
            var self = this;
            var order = this.get_order();
            // Remove old html
            this.$(".pos-receipt-container").html("");
            if (ticket) {
                // Add new html
                this.$(".pos-receipt-container").html(ticket.receipt);
                if (this.pos.config.show_barcode_in_receipt) {
                    // Reference without 'Order'
                    var receipt_reference =
                        order.pos_reference &&
                        order.pos_reference.match(/\d{1,}-\d{1,}-\d{1,}/g) &&
                        order.pos_reference.match(/\d{1,}-\d{1,}-\d{1,}/g)[0];
                    this.$el
                        .find("#barcode")
                        .JsBarcode(receipt_reference, {format: "code128"});
                    this.$el.find("#barcode").css({
                        width: "100%",
                    });
                }
            } else if (self.pos.config.show_posted_orders && order.state === "done") {
                new Model("pos.xml_receipt")
                    .call("search_read", [
                        [
                            ["pos_reference", "=", order.pos_reference],
                            ["receipt_type", "=", "ticket"],
                        ],
                    ])
                    .then(function(t) {
                        if (t && t.length) {
                            self.render_receipt(t[0]);
                        } else {
                            self.gui.show_popup("error", {
                                title: _t("No Ticket."),
                                body: _t("There is no Ticket for the order."),
                            });
                        }
                    });
            } else {
                var ticketbyref = this.pos.get_receipt_by_order_reference_and_type(
                    order.pos_reference,
                    "ticket"
                );
                if (ticketbyref) {
                    self.render_receipt(ticketbyref);
                } else {
                    this.gui.show_popup("error", {
                        title: _t("No Ticket."),
                        body: _t("There is no Ticket for the order."),
                    });
                }
            }
        },
    });

    gui.define_screen({
        name: "reprint_receipt",
        widget: screens.ReprintReceiptScreenWidget,
    });

    return screens;
});
