odoo.define("pos_debt_notebook.OrderReceipt", function (require) {
    "use strict";

    const OrderReceipt = require("point_of_sale.OrderReceipt");
    const Registries = require("point_of_sale.Registries");

    const MyOrderReceipt = (_OrderReceipt) =>
        class extends _OrderReceipt {
            get paymentlines_without_credits_via_discount() {
                return super.paymentlines.collection.models
                    .filter((line) => {
                        return !line.cashregister.journal.credits_via_discount;
                    })
                    .map((line) => {
                        return line.export_for_printing();
                    });
            }

            get paymentlines_with_credits_via_discount() {
                return super.receiptEnv.order.has_paymentlines_with_credits_via_discounts();
            }
        };

    Registries.Component.extend(OrderReceipt, MyOrderReceipt);

    return MyOrderReceipt;
});
