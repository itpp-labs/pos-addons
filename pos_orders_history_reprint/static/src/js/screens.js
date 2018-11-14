/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Artem Losev
 * Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_orders_history_reprint.screens', function (require) {
    "use strict";

    var gui = require('point_of_sale.gui');
    var screens = require('pos_orders_history.screens');
    var core = require('web.core');
    var rpc = require('web.rpc');
    var utils = require('web.utils');

    var round_pr = utils.round_precision;
    var QWeb = core.qweb;
    var _t = core._t;

    screens.ReceiptScreenWidget.include({
        print_xml: function() {
            this._super();
            var order = this.pos.get_order();
            var env = {
                widget:  this,
                pos: this.pos,
                order: order,
                receipt: order.export_for_printing(),
                paymentlines: order.get_paymentlines()
            };
            var receipt = QWeb.render('XmlReceipt',env);
            this.save_order_receipt(order, receipt, 'xml');
        },
        save_order_receipt: function (order, receipt, receipt_type) {
            var name = order.name;
            rpc.query({
                model: 'pos.xml_receipt',
                method: 'save_xml_receipt',
                args: [[], name, receipt, receipt_type]
            }).then(function (result) {
                console.log(receipt_type, ' receipt has been saved.');
            });
        },
        render_receipt: function() {
            this._super();
            var order = this.pos.get_order();
            var env = {
                widget:  this,
                order: order,
                receipt: order.export_for_printing(),
                orderlines: order.get_orderlines(),
                paymentlines: order.get_paymentlines()
            };
            var ticket = QWeb.render('PosTicket',env);
            this.save_order_receipt(order, ticket, 'ticket');
        },
    });

    screens.OrdersHistoryScreenWidget.include({
        show: function () {
            var self = this;
            this._super();
            if (this.pos.config.reprint_orders) {
                this.$('.actions.oe_hidden').removeClass('oe_hidden');
                this.$('.button.reprint').unbind('click');
                this.$('.button.reprint').click(function (e) {
                    var parent = $(this).parents('.order-line');
                    var id = parseInt(parent.data('id'));
                    self.click_reprint_order(id);
                });
            }
        },
        click_reprint_order: function (id) {
            this.gui.show_screen('history_reprint_receipt', {order_id: id});
        },
    });

    screens.ReprintReceiptScreenWidget = screens.ReceiptScreenWidget.extend({
        template: 'ReprintReceiptScreenWidget',
        show: function () {
            var self = this;
            this._super();
            this.$('.back').click(function () {
                self.gui.show_screen('orders_history_screen');
            });
        },
        get_order: function () {
            var order_id = this.gui.get_current_screen_param('order_id');
            return this.pos.db.orders_history_by_id[order_id];
        },
        print_xml: function (receipt) {
            var self = this;
            this.show_popup = false;
            var order = this.get_order();
            if (receipt) {
                receipt = receipt.receipt;
                if (this.pos.config.show_barcode_in_receipt) {
                    var barcode = this.$el.find('#barcode').parent().html();
                    if (!barcode) {
                        var receipt_reference = order.pos_reference.split(" ")[1];
                        var el = document.createElement('div');
                        $(el).append("<img id='barcode'></img>");
                        $(el).find('#barcode').JsBarcode(receipt_reference, {format: "code128"});
                        $(el).find('#barcode').css({
                            "width": "100%"
                        });
                        barcode = $(el).find('#barcode').parent().html();
                    }
                    receipt = receipt.split('<img id="barcode"/>');
                    receipt[0] = receipt[0] + barcode + '</img>';
                    receipt = receipt.join('');
                }
                this.pos.proxy.print_receipt(receipt);
            } else if (self.pos.config.show_posted_orders && order.state === "done") {
                rpc.query({
                    model: 'pos.xml_receipt',
                    method: 'search_read',
                    args: [[['pos_reference', '=', order.pos_reference],['receipt_type', '=', 'xml']]]
                }).then(function(r) {
                    if (r && r.length) {
                        self.print_xml(r[0]);
                    } else {
                        self.show_popup = true;
                        self.click_next();
                    }
                });
            } else {
                receipt = this.pos.get_receipt_by_order_reference_and_type(order.pos_reference, 'xml');
                if (receipt) {
                    this.print_xml(receipt);
                } else {
                    this.show_popup = true;
                    self.click_next();
                }
            }
        },
        click_next: function() {
            this.gui.show_screen('orders_history_screen');
            if (this.show_popup) {
                this.gui.show_popup('error',{
                    'title': _t('No XML Receipt.'),
                    'body': _t('There is no XML receipt for the order.'),
                });
            }
        },
        print_web: function() {
            window.print();
        },
        render_receipt: function (ticket) {
            var self = this;
            var order = this.get_order();
            // remove old html
            this.$('.pos-receipt-container').html("");
            if (ticket) {
                // add new html
                this.$('.pos-receipt-container').html(ticket.receipt);
                if (this.pos.config.show_barcode_in_receipt) {
                    // reference without 'Order'
                    var receipt_reference = order.pos_reference.split(" ")[1];
                    this.$el.find('#barcode').JsBarcode(receipt_reference, {format: "code128"});
                    this.$el.find('#barcode').css({
                        "width": "100%"
                    });
                }
            } else if (self.pos.config.show_posted_orders && order.state === "done") {
                rpc.query({
                    model: 'pos.xml_receipt',
                    method: 'search_read',
                    args: [[['pos_reference', '=', order.pos_reference],['receipt_type', '=', 'ticket']]]
                }).then(function(t) {
                    if (t && t.length) {
                        self.render_receipt(t[0]);
                    } else {
                        self.gui.show_popup('error',{
                            'title': _t('No Ticket.'),
                            'body': _t('There is no Ticket for the order.'),
                        });
                    }
                });
            } else {
                ticket = this.pos.get_receipt_by_order_reference_and_type(order.pos_reference, 'ticket');
                if (ticket) {
                    self.render_receipt(ticket);
                } else {
                    this.gui.show_popup('error',{
                        'title': _t('No Ticket.'),
                        'body': _t('There is no Ticket for the order.'),
                    });
                }
            }
        }
    });

    gui.define_screen({name:'history_reprint_receipt', widget: screens.ReprintReceiptScreenWidget});

    return screens;
});
