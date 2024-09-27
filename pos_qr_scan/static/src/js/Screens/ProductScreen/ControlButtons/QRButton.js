odoo.define("pos_qr_scan.QRButton", function (require) {
    "use strict";

    const PosComponent = require("point_of_sale.PosComponent");
    const ProductScreen = require("point_of_sale.ProductScreen");
    const {useListener} = require("web.custom_hooks");
    const Registries = require("point_of_sale.Registries");

    class QRButton extends PosComponent {
        constructor() {
            super(...arguments);
            useListener("click", this.onClick);
        }

        async onClick() {
            await this.showPopup("QRScanPopup", {});
        }
    }

    QRButton.template = "QRButton";

    ProductScreen.addControlButton({
        component: QRButton,
        condition: function () {
            return true;
        },
    });

    Registries.Component.add(QRButton);

    return QRButton;
});
