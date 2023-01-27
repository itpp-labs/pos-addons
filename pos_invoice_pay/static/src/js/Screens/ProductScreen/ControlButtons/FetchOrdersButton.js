odoo.define("pos_invoice_pay.FetchOrdersButton", function (require) {
    const { useListener } = require("web.custom_hooks");
    const PosComponent = require("point_of_sale.PosComponent");
    const ProductScreen = require("point_of_sale.ProductScreen");
    const Registries = require("point_of_sale.Registries");
    const useSelectEmployee = require("pos_hr.useSelectEmployee");

    class FetchOrdersButton extends PosComponent {
        constructor() {
            super(...arguments);
            const { selectEmployee } = useSelectEmployee();
            this.selectEmployee = selectEmployee;
            useListener("click", this.onClick);
        }

        get nextScreen() {
            return "SaleOrderListScreen";
        }

        async onClick() {
            if (!this.env.pos.config.sale_order_cashier_selection) {
                this.showScreen(this.nextScreen);
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
                this.showScreen(this.nextScreen);
            }
        }
    }

    FetchOrdersButton.template = "FetchOrdersButton";

    ProductScreen.addControlButton({
        component: FetchOrdersButton,
        condition: function () {
            return this.env.pos.config.show_sale_orders;
        },
    });

    Registries.Component.add(FetchOrdersButton);

    return FetchOrdersButton;
});
