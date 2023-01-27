odoo.define("pos_invoice_pay.InvoiceListScreen", function (require) {
    const { debounce } = owl.utils;
    const { useRef } = owl.hooks;
    const core = require("web.core");
    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    const _t = core._t;

    class InvoiceListScreen extends PosComponent {
        constructor() {
            super(...arguments);

            this.state = {
                query: null,
                selectedInvoice: this.props.selectedInvoice,
            };

            this.env.pos.on("invoice-updated", () => this.render());
            this.updateList = debounce(this.updateList, 70);
            this.searchInput = useRef("search-input");
        }

        get items() {
            let r = [];
            if (this.state.query && this.state.query.trim() !== "") {
                r = this.env.pos.db.search_invoices(this.state.query);
            } else {
                r = this.env.pos.db.invoices;
            }
            return this.env.pos.get_invoices_to_render(r);
        }

        updateList(event) {
            this.state.query = event.target.value;
            this.render();
        }

        back() {
            this.showScreen("ProductScreen");
        }

        clickInvoice(event) {
            const invoice = event.detail.invoice;
            if (this.state.selectedInvoice === invoice) {
                this.state.selectedInvoice = null;
            } else {
                this.state.selectedInvoice = invoice;
            }
            this.render();
        }

        onClickSearchIcon() {
            this.state.query = "";
            this.searchInput.el.value = "";
            this.render();
        }

        onClickRegister() {
            if (this.state.selectedInvoice) {
                const order = this.env.pos.get_order();
                if (order) {
                    // TODO: это портированый костыль. На самом деле, у selectedInvoice должны быть свои методы
                    order.invoice_to_pay = this.state.selectedInvoice;
                }
                this.showScreen("InvoicePaymentScreen", { type: "invoices" });
            } else {
                this.showPopup("ErrorPopup", {
                    title: _t("No invoice"),
                    body: _t("There must be invoice selected."),
                });
            }
        }
    }

    InvoiceListScreen.template = "InvoiceListScreen";

    Registries.Component.add(InvoiceListScreen);

    return InvoiceListScreen;
});
