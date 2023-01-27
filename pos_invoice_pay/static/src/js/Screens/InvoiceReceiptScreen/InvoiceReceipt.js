odoo.define("pos_invoice_pay.InvoiceReceipt", function (require) {
    const OrderReceipt = require("point_of_sale.OrderReceipt");
    const Registries = require("point_of_sale.Registries");

    const InvoiceReceipt = (_OrderReceipt) => {
        class _InvoiceReceipt extends _OrderReceipt {
            constructor() {
                super(...arguments);
                this._receiptEnv = this.props.order.getInvoiceReceiptEnv();
            }

            willUpdateProps(nextProps) {
                this._receiptEnv = nextProps.order.getInvoiceReceiptEnv();
            }

            get isTaxIncluded() {
                return false;
            }
        }
        _InvoiceReceipt.template = "InvoiceReceipt";
        return _InvoiceReceipt;
    };

    Registries.Component.addByExtending(InvoiceReceipt, OrderReceipt);

    return InvoiceReceipt;
});
