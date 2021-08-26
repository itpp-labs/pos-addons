/* Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
   License MIT (https://opensource.org/licenses/MIT). */
/* eslint no-alert: "off"*/
odoo.define("pos_qr_scan", function (require) {
    "use strict";

    var models = require("point_of_sale.models");

    // Add some helpers:
    // * No need to show Cashregister that is used by scanning QR customer's code
    models.PosModel = models.PosModel.extend({
        // Before porting 14.0 it had name hide_cashregister
        hide_payment_method: function (payment_method_filter) {
            let payment_method = _.filter(this.payment_methods, payment_method_filter);
            if (payment_method.length) {
                if (payment_method.length > 1) {
                    // TODO warning
                    console.log(
                        "error",
                        "More than one payment method to hide is found",
                        payment_method
                    );
                }
                payment_method = payment_method[0];
            } else {
                return false;
            }
            this.payment_methods = _.filter(this.payment_methods, (r) => {
                if (r.id === payment_method.id) {
                    this.hidden_payment_methods.push(r);
                    return false;
                }
                return true;
            });

            return payment_method;
        },
    });
});
