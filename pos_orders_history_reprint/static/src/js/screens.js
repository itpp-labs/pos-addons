/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Artem Losev
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_orders_history_reprint.screens', function (require) {
    "use strict";

    var gui = require('point_of_sale.gui');
    var screens = require('pos_orders_history.screens');
    var core = require('web.core');
    var Model = require('web.Model');
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
            this.save_order_xml(order, receipt);
        },
        save_order_xml: function (order, receipt) {
            var name = order.name,
                receipt = receipt;
            new Model('pos.xml_receipt').call('save_xml_receipt', [[], name, receipt]).then(function () {
                console.log('XML receipt has been saved.');
            });
        },
    });

    screens.OrdersHistoryScreenWidget.include({
        show: function () {
            var self = this;
            this._super();
            this.$('.button.reprint').addClass('line-element-hidden');

            this.$('.button.reprint').unbind().click(function (e) {
                self.reprint_order();
            });
        },
        reprint_order: function () {
            if (!this.selected_order) {
                return;
            }
            this.gui.show_screen('reprint_receipt');
        },
        clear_selected_order: function () {
            this.selected_order = false;
        },

        line_select: function (event, $line, id) {
            this._super(event, $line, id);
            if ($line.hasClass('active')) {
                this.$('.button.reprint').removeClass('line-element-hidden');
            } else {
                this.$('.button.reprint').addClass('line-element-hidden');
            }
        }
    });

    screens.ReprintReceiptScreenWidget = screens.ReceiptScreenWidget.extend({
        template: 'ReprintReceiptScreenWidget',
        init: function (options) {
            this._super(options);
            this.orders_history_screen = this.gui.screen_instances.orders_history_screen;
        },
        show: function () {
            var self = this;
            this._super();
            this.$('.back').click(function () {
                self.gui.show_screen('orders_history_screen');
            });
        },
        handle_auto_print: function() {
            if (this.should_auto_print()) {
                this.print();
                if (this.should_close_immediately()){
                    this.click_next();
                }
            } else {
                this.lock_screen(false);
            }
        },
        should_close_immediately: function() {
            return this.pos.config.iface_print_via_proxy && this.pos.config.iface_print_skip_screen;
        },
        should_auto_print: function() {
            return this.pos.config.iface_print_auto;
        },
        click_next: function() {
            this.gui.show_screen('orders_history_screen');
        },
        get_order: function () {
            return this.orders_history_screen.selected_order;
        },
        get_orderlines: function (order) {
            var self = this,
                ids = order.lines;
            return _.map(ids, function (id, index) {
                return self.pos.db.line_by_id[id];
            });
        },
        get_additional_data: function (id) {
            var self = this,
                def = $.Deferred();
            new Model('pos.order').call('send_pos_ticket_reprint_data', [id])
            .then(function (res) {
                def.resolve(res);
            });
            return def;
        },
        print_xml: function () {
            var self = this,
                ref = this.get_order().pos_reference;
            new Model('pos.xml_receipt')
                .query(['receipt'])
                .filter([['pos_reference', '=', ref]])
                .all().then(function (res) {
                    if (res && Array.isArray(res) && res[0]) {
                        var receipt = res[0].receipt.replace('\n', '');
                        self.pos.proxy.print_receipt(receipt);
                    } else {
                        self.gui.show_popup('error',{
                            'title': _t('No XML Receipt.'),
                            'body': _t('There is no XML receipt for the selected order.'),
                        });
                    }
                });
        },
        render_receipt: function () {
            var self = this,
                order = this.get_order(),
                orderlines = this.get_orderlines(order);
                this.get_additional_data(order.id).then(function (res) {
                    var data = res;
                    self.$('.pos-receipt-container').html(QWeb.render('PosTicketReprint', {
                        widget: self,
                        order: order,
                        orderlines: orderlines,
                        paymentlines: data.paymentlines,
                        taxes: data.taxes,
                        receipt: self.pos.get_order()
                            ? self.pos.get_order().export_for_printing()
                            : self.get_receipt_data()
                    }));
                });
        },
        get_receipt_data: function () {
            function is_xml(subreceipt){
                return subreceipt ? (subreceipt.split('\n')[0].indexOf('<!DOCTYPE QWEB') >= 0) : false;
            }
            var company = this.pos.company,
                receipt = {
                    company: {
                        email: company.email,
                        website: company.website,
                        company_registry: company.company_registry,
                        contact_address: company.partner_id[1],
                        vat: company.vat,
                        name: company.name,
                        phone: company.phone,
                        logo:  this.pos.company_logo_base64,
                    },
                }
            if (is_xml(this.pos.config.receipt_header)){
                receipt.header = '';
                receipt.header_xml = render_xml(this.pos.config.receipt_header);
            } else {
                receipt.header = this.pos.config.receipt_header || '';
            }

            if (is_xml(this.pos.config.receipt_footer)){
                receipt.footer = '';
                receipt.footer_xml = render_xml(this.pos.config.receipt_footer);
            } else {
                receipt.footer = this.pos.config.receipt_footer || '';
            }

            return receipt;
        },
        get_total_discount: function (orderlines) {
            return round_pr(orderlines.reduce((function (sum, orderLine) {
                return sum + (orderLine.price_unit * (orderLine.discount/100) * orderLine.qty);
            }), 0), this.pos.currency.rounding);
        },
        get_total_without_tax: function (orderlines) {
            return round_pr(orderlines.reduce((function (sum, orderLine) {
                return sum + orderLine.price_unit * orderLine.qty ;
            }), 0), this.pos.currency.rounding);
        },
        get_subtotal: function (orderlines) {
            return round_pr(orderlines.reduce((function (sum, orderLine) {
                return sum + orderLine.price_subtotal;
            }), 0), this.pos.currency.rounding);
        },
        render_change: function () {
            return;
        },
    });

    gui.define_screen({name:'reprint_receipt', widget: screens.ReprintReceiptScreenWidget});

    return screens;
});
