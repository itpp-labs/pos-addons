odoo.define("pos_invoice_pay.InvoicePaymentScreenStatus", function (require) {
    const PaymentScreenStatus = require("point_of_sale.PaymentScreenStatus");
    const Registries = require("point_of_sale.Registries");

    const InvoicePaymentScreenStatus = (_PaymentScreenStatus) => {
        class _InvoicePaymentScreenStatus extends _PaymentScreenStatus {
            get changeText() {
                return this.env.pos.format_currency(
                    this.currentOrder.invoice_get_change()
                );
            }
            get totalDueText() {
                return this.env.pos.format_currency(
                    this.currentOrder.invoice_to_pay.amount_residual
                );
            }
        }
        _InvoicePaymentScreenStatus.template = "InvoicePaymentScreenStatus";
        return _InvoicePaymentScreenStatus;
    };

    Registries.Component.addByExtending(
        InvoicePaymentScreenStatus,
        PaymentScreenStatus
    );

    return InvoicePaymentScreenStatus;
});
