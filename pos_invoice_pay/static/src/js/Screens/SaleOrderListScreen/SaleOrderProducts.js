odoo.define("pos_invoice_pay.SaleOrderProducts", function (require) {
    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    class SaleOrderProducts extends PosComponent {}

    SaleOrderProducts.template = "SaleOrderProducts";

    Registries.Component.add(SaleOrderProducts);

    return SaleOrderProducts;
});
