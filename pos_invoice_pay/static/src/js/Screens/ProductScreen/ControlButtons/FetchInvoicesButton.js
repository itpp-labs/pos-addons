odoo.define("pos_invoice_pay.FetchInvoicesButton", function (require) {
    const { useListener } = require("web.custom_hooks");
    const PosComponent = require("point_of_sale.PosComponent");
    const ProductScreen = require("point_of_sale.ProductScreen");
    const Registries = require("point_of_sale.Registries");
    const useSelectEmployee = require("pos_hr.useSelectEmployee");

    class FetchInvoicesButton extends PosComponent {
        constructor() {
            super(...arguments);
            const { selectEmployee } = useSelectEmployee();
            this.selectEmployee = selectEmployee;
            useListener("click", this.onClick);
        }

        async onClick() {
            if (!this.env.pos.config.invoice_cashier_selection) {
                this.showScreen("InvoiceListScreen");
                return;
            }

            const list = this.env.pos.employees.map((employee) => {
                return {
                    id: employee.id,
                    item: employee,
                    label: employee.name,
                    isSelected: false,
                };
            });

            const employee = await this.selectEmployee(list);
            if (employee) {
                this.env.pos.set_cashier(employee);
                this.showScreen("InvoiceListScreen");
            }
        }
    }

    FetchInvoicesButton.template = "FetchInvoicesButton";

    ProductScreen.addControlButton({
        component: FetchInvoicesButton,
        condition: function () {
            return this.env.pos.config.show_invoices;
        },
    });

    Registries.Component.add(FetchInvoicesButton);

    return FetchInvoicesButton;
});
