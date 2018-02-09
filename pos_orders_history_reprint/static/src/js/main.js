odoo.define('pos_orders_history_reprint', function (require) {
"use strict";
var gui = require('point_of_sale.gui');
var OrdersHistoryScreenWidget = require('pos_orders_history').OrdersHistoryScreenWidget;
var ReceiptScreenWidget = require('point_of_sale.screens').ReceiptScreenWidget;
var Order = require('point_of_sale.models').Order;
var models = require('point_of_sale.models');
var core = require('web.core');
var Model = require('web.Model');
var utils = require('web.utils');

var round_pr = utils.round_precision;
var QWeb = core.qweb;
var _t = core._t;


var ReprintWidget = OrdersHistoryScreenWidget.extend({
    show: function () {
        var self = this;
        this._super();

        this.$('.button.reprint').addClass('line-element-hidden');
        this.$('.button.reprint').click(function (e) {
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

gui.define_screen({name:'orders_history_screen', widget: ReprintWidget});


var ReprintReceiptScreenWidget = ReceiptScreenWidget.extend({
    template: 'ReprintReceiptScreenWidget',
    init: function (options) {
        this._super(options);
        this.orders_history_screen = this.gui.screen_instances.orders_history_screen;
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

    show: function () {
        var self = this;
        this._super();
        this.$('.back').click(function () {
            self.gui.show_screen('orders_history_screen');
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
                    // receipt: order.export_for_printing(),
                    orderlines: orderlines,
                    paymentlines: data.paymentlines,
                    taxes: data.taxes
                }));
            }); 
        this.orders_history_screen.clear_selected_order();
    },

    get_total_discount: function (orderlines) {
        return round_pr(orderlines.reduce((function(sum, orderLine) {
            return sum + (orderLine.price_unit * (orderLine.discount/100) * orderLine.qty);
        }), 0), this.pos.currency.rounding);
    },

    get_total_without_tax: function(orderlines) {
        return round_pr(orderlines.reduce((function(sum, orderLine) {
            return sum + orderLine.price_unit * orderLine.qty ;
        }), 0), this.pos.currency.rounding); 
    }

});

gui.define_screen({name:'reprint_receipt', widget: ReprintReceiptScreenWidget});


});
