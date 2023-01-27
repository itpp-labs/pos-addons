odoo.define("pos_invoice_pay.InvoiceProducts", function (require) {
    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    class InvoiceProducts extends PosComponent {}

    InvoiceProducts.template = "InvoiceProducts";

    Registries.Component.add(InvoiceProducts);

    return InvoiceProducts;
});
