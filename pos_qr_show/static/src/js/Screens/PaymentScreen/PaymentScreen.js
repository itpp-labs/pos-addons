odoo.define("pos_qr_show.PaymentScreen", function (require) {
    "use strict";

    const PaymentScreen = require("point_of_sale.PaymentScreen");
    const Registries = require("point_of_sale.Registries");

    const PosQRShowPaymentScreen = (PaymentScreen) =>
        class extends PaymentScreen {
            onPaymentQR(payment_qr) {
                // Based on on_payment_qr + show_payment_qr_on_payment_screen
                // TODO shall we save type of qr too?

                this.currentOrder.payment_qr = payment_qr;
                /* EcLevel -- Error Correction Level
                     L - Low (7%)
                     M - Medium (15%)
                     Q - Quartile (25%)
                     H - High (30%)

                     For more options see https://larsjung.de/jquery-qrcode/
                  */
                $(".qr-container").qrcode({
                    text: payment_qr,
                    ecLevel: "H",
                    size: 400,
                });

                if (this.env.pos.config.iface_customer_facing_display) {
                    this.env.pos.send_current_order_to_customer_facing_display();
                }
            }

            addNewPaymentLine({detail: paymentMethod}) {
                if (this.env.pos.test_pos_qr_show) {
                    // Used only for testing perposes.
                    // the variable must be set manually in javascript console
                    this.onPaymentQR(this.env.pos.test_pos_qr_show);
                }
                return super.addNewPaymentLine.apply(this, arguments);
            }
        };

    Registries.Component.extend(PaymentScreen, PosQRShowPaymentScreen);

    return PaymentScreen;
});
