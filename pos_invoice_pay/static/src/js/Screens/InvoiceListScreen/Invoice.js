odoo.define("pos_invoice_pay.Invoice", function (require) {
    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    class Invoice extends PosComponent {
        get item() {
            return this.props.invoice;
        }

        get isSelected() {
            return this.props.selectedInvoice === this.props.invoice;
        }
    }

    Invoice.template = "Invoice";

    Registries.Component.add(Invoice);

    return Invoice;
});
