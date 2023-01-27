odoo.define("pos_invoice_pay.InvoiceReceiptScreen", function (require) {
    "use strict";

    const ReceiptScreen = require("point_of_sale.ReceiptScreen");
    const Registries = require("point_of_sale.Registries");

    const InvoiceReceiptScreen = (_ReceiptScreen) => {
        class _InvoiceReceiptScreen extends _ReceiptScreen {}
        _InvoiceReceiptScreen.template = "InvoiceReceiptScreen";
        return _InvoiceReceiptScreen;
    };

    Registries.Component.addByExtending(InvoiceReceiptScreen, ReceiptScreen);

    return InvoiceReceiptScreen;
});
