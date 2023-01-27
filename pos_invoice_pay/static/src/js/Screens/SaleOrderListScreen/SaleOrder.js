odoo.define("pos_invoice_pay.SaleOrder", function (require) {
    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    class SaleOrder extends PosComponent {
        get item() {
            return this.props.saleOrder;
        }
    }

    SaleOrder.template = "SaleOrder";

    Registries.Component.add(SaleOrder);

    return SaleOrder;
});
