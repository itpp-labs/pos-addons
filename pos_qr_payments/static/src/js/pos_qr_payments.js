/* Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_qr_payments", function (require) {
    "use strict";
    var models = require("point_of_sale.models");
    var core = require("web.core");
    const {Gui} = require("point_of_sale.Gui");

    var _t = core._t;

    const PaymentScreen = require("point_of_sale.PaymentScreen");
    const Registries = require("point_of_sale.Registries");

    const MyPaymentScreen = (PaymentScreen) =>
        class extends PaymentScreen {
            constructor() {
                super(...arguments);
                this.env.pos.bind(
                    "validate_order",
                    async function () {
                        await this.validateOrder();
                    },
                    this
                );
            }
        };

    Registries.Component.extend(PaymentScreen, MyPaymentScreen);

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function () {
            this.hidden_payment_methods = [];
            return PosModelSuper.prototype.initialize.apply(this, arguments);
        },
        show_warning: function (warning_message) {
            console.info("error", warning_message);
            Gui.showPopup("ErrorPopup", {
                title: _t("Warning"),
                body: warning_message,
            });
        },
        add_qr_payment: function (
            order_uid,
            journal_id,
            amount,
            payment_vals,
            validate
        ) {
            var order = this.get("orders").find(function (item) {
                return item.uid === order_uid;
            });
            if (order) {
                var creg = _.filter(
                    this.hidden_payment_methods.concat(this.payment_methods),
                    function (r) {
                        return r.journal_id[0] === journal_id;
                    }
                )[0];

                // Add payment
                payment_vals = _.extend({}, payment_vals, {
                    order: order,
                    journal_id: journal_id,
                    cashregister: creg,
                    pos: this,
                });
                var newPaymentline = new models.Paymentline({}, payment_vals);
                newPaymentline.set_amount(amount);
                order.paymentlines.add(newPaymentline);

                if (validate && order.is_paid()) {
                    /* Order is paid and has to be closed */
                    this.trigger("validate_order");
                }
                return order;
            }
            console.log("error", "Order is not found");
            return false;
        },
    });
});
