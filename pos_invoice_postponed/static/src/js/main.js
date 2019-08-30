/* Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_invoice_postponed.pos', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var utils = require('web.utils');
    var Model = require('web.DataModel');
    var PopupWidget = require('point_of_sale.popups');

    var QWeb = core.qweb;
    var _t = core._t;
    var round_pr = utils.round_precision;

    models.load_fields('account.journal', ['postponed_invoice']);

    screens.PaymentScreenWidget.include({
        init: function(parent, options) {
            this._super(parent, options);
        },
        validate_order: function(options) {
            var order = this.pos.get_order();
            var paymentlines = order.get_paymentlines();
            var client = order.get_client();
            var postponed_invoice_paymentlines = _.filter(paymentlines, function(pl){
                return pl.cashregister.journal.postponed_invoice;
            });
            if (postponed_invoice_paymentlines && postponed_invoice_paymentlines.length){
                if (!client) {
                    this.gui.show_popup('error',{
                        'title': _t('Customer Error'),
                        'body': _t('Customer is not set. Please set a customer to proceed postponed invoice payment'),
                    });
                    return;
                }
                if (paymentlines.length !== postponed_invoice_paymentlines.length) {
                    this.gui.show_popup('error',{
                        'title': _t('Payment Method Error'),
                        'body': _t('Please do not use postpone payment methods with regular ones'),
                    });
                    return;
                }
            }
            this._super(options);
        },
    });

});
