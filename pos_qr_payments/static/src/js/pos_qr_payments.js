/* Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define("pos_qr_payments", function(require) {
    var gui = require("point_of_sale.gui");
    var models = require("point_of_sale.models");
    var core = require("web.core");

    var _t = core._t;

    gui.Gui.prototype.screen_classes
        .filter(function(el) {
            return el.name === "payment";
        })[0]
        .widget.include({
            init: function(parent, options) {
                this._super(parent, options);
                this.pos.bind(
                    "validate_order",
                    function() {
                        this.validate_order();
                    },
                    this
                );
            },
        });

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function() {
            this.hidden_cashregisters = [];
            return PosModelSuper.prototype.initialize.apply(this, arguments);
        },
        show_warning: function(warning_message) {
            console.info("error", warning_message);
            this.chrome.gui.show_popup("error", {
                title: _t("Warning"),
                body: warning_message,
            });
        },
        add_qr_payment: function(
            order_uid,
            journal_id,
            amount,
            payment_vals,
            validate
        ) {
            var order = this.get("orders").find(function(item) {
                return item.uid === order_uid;
            });
            if (order) {
                var creg = _.filter(
                    this.hidden_cashregisters.concat(this.cashregisters),
                    function(r) {
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
