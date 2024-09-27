odoo.define("pos_qr_show.QRPopup", function (require) {
    "use strict";

    const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
    const Registries = require("point_of_sale.Registries");

    class QRPopup extends AbstractAwaitablePopup {
        mounted() {
            super.mounted.apply(this, arguments);
            /* EcLevel -- Error Correction Level
               L - Low (7%)
               M - Medium (15%)
               Q - Quartile (25%)
               H - High (30%)

               For more options see https://larsjung.de/jquery-qrcode/
            */
            $(".qr-container").qrcode({
                text: this.props.qrcode,
                ecLevel: "H",
                size: 400,
            });
        }
    }
    QRPopup.template = "QRPopup";
    QRPopup.defaultProps = {
        cancelText: "Cancel",
        title: "Scan QR code",
    };

    Registries.Component.add(QRPopup);

    return QRPopup;
});
