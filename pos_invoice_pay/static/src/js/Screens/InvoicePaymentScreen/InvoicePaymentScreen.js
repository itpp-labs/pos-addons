odoo.define("pos_invoice_pay.InvoicePaymentScreen", function (require) {
    const PaymentScreen = require("point_of_sale.PaymentScreen");
    const Registries = require("point_of_sale.Registries");
    const core = require("web.core");
    const rpc = require("web.rpc");

    const _t = core._t;

    const InvoicePaymentScreen = (_PaymentScreen) => {
        class _InvoicePaymentScreen extends _PaymentScreen {
            async willStart() {
                if (this.env.pos.config.module_account) {
                    console.log("this.props.type", this.props.type);
                    if (this.props.type === "orders") {
                        this.currentOrder.set_to_invoice(true);
                    } else if (this.props.type === "invoices") {
                        this.currentOrder.set_to_invoice(false);
                    }
                }
            }

            addNewPaymentLine(paymentLine) {
                const r = super.addNewPaymentLine(paymentLine);
                const paymentMethod = paymentLine.detail;
                if (r) {
                    if (
                        paymentMethod.is_cash_count ||
                        this.env.pos.config.iface_precompute_cash
                    ) {
                        this.currentOrder.selected_paymentline.set_amount(
                            this.currentOrder.invoice_get_due()
                        );
                    }
                }
                return r;
            }

            async validateOrder(isForceValidate) {
                const order = this.currentOrder;
                if (
                    !this.env.pos.config.pos_invoice_pay_writeoff_account_id &&
                    order.invoice_to_pay &&
                    order.get_total_paid() > order.invoice_get_residual()
                ) {
                    this.showPopup("ErrorPopup", {
                        title: _t("Excessive payment amount."),
                        body: _t(
                            "You can not validate the order with a change because difference account is not set. Please enter the exact payment amount."
                        ),
                    });
                    return;
                }

                return await super.validateOrder(isForceValidate);
            }

            async _finalizeValidation() {
                const isInvoiceButtonToggled = this.currentOrder.is_to_invoice();
                this.currentOrder.set_to_invoice(false);
                await super._finalizeValidation();
                this.env.pos.update_or_fetch_invoice(
                    this.currentOrder.invoice_to_pay.id
                );
                if (isInvoiceButtonToggled) {
                    const action = await rpc.query({
                        model: "account.move",
                        method: "action_invoice_print",
                        args: [this.currentOrder.invoice_to_pay.id],
                        context: { discard_logo_check: true },
                    });
                    this.env.pos.do_action(action);
                }
            }

            get nextScreen() {
                return "InvoiceReceiptScreen";
            }

            async _isOrderValid(isForceValidate) {
                const order = this.currentOrder;
                const plines = order.get_paymentlines();

                if (plines.length === 0) {
                    this.showPopup("ErrorPopup", {
                        title: _t("Zero payment amount."),
                        body: _t(
                            "You can not validate the order with zero payment amount."
                        ),
                    });
                    return false;
                }

                for (let i = 0; i < plines.length; i++) {
                    if (plines[i].get_amount() <= 0) {
                        this.showPopup("ErrorPopup", {
                            title: _t("Wrong payment amount."),
                            body: _t("You can only create positive payments."),
                        });
                        return false;
                    }
                }
                return true;
            }
        }
        _InvoicePaymentScreen.template = "InvoicePaymentScreen";
        return _InvoicePaymentScreen;
    };

    Registries.Component.addByExtending(InvoicePaymentScreen, PaymentScreen);

    return InvoicePaymentScreen;
});
