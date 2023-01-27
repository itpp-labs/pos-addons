odoo.define("pos_invoice_pay.SaleOrderListScreen", function (require) {
    const { debounce } = owl.utils;
    const { useRef } = owl.hooks;
    const core = require("web.core");
    const rpc = require("web.rpc");
    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    const _t = core._t;

    class SaleOrderListScreen extends PosComponent {
        constructor() {
            super(...arguments);

            this.state = {
                query: null,
                selectedSaleOrder: this.props.selectedSaleOrder,
            };

            this.env.pos.on("sale-order-updated", () => this.render());
            this.updateList = debounce(this.updateList, 70);
            this.searchInput = useRef("search-input");
        }

        get items() {
            let r = [];
            if (this.state.query && this.state.query.trim() !== "") {
                r = this.env.pos.db.search_sale_orders(this.state.query);
            } else {
                r = this.env.pos.db.sale_orders;
            }
            return this.env.pos.get_sale_order_to_render(r);
        }

        updateList(event) {
            this.state.query = event.target.value;
            this.render();
        }

        back() {
            this.showScreen("ProductScreen");
        }

        clickSaleOrder(event) {
            const so = event.detail.saleOrder;
            if (this.state.selectedSaleOrder === so) {
                this.state.selectedSaleOrder = null;
            } else {
                this.state.selectedSaleOrder = so;
            }
            this.render();
        }

        onClickSearchIcon() {
            this.state.query = "";
            this.searchInput.el.value = "";
            this.render();
        }

        onClickCreateInvoice() {
            if (this.state.selectedSaleOrder) {
                rpc.query({
                    model: "pos.order",
                    method: "process_invoices_creation",
                    args: [this.state.selectedSaleOrder.id],
                }).then((created_invoice_id) => {
                    // Explicitly update the db to avoid race condition.
                    this.env.pos
                        .update_or_fetch_invoice(created_invoice_id)
                        .then((res) => {
                            this.env.pos.get_order().invoice_to_pay = this.env.pos.db.get_invoice_by_id(
                                res
                            );
                            this.showScreen("InvoicePaymentScreen", { type: "orders" });
                        });
                });
            } else {
                this.showPopup("ErrorPopup", {
                    title: _t("No invoice"),
                    body: _t("There must be invoice selected."),
                });
            }
        }
    }

    SaleOrderListScreen.template = "SaleOrderListScreen";

    Registries.Component.add(SaleOrderListScreen);

    return SaleOrderListScreen;
});
