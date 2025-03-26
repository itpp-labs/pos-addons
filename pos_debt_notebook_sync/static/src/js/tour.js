// License MIT (https://opensource.org/licenses/MIT).
odoo.define("pos_debt_notebook_sync.tour", function (require) {


    var tour = require("web_tour.tour");
    var core = require("web.core");
    var _t = core._t;

    function open_pos_neworder() {
        return [
            tour.stepUtils.showAppsMenuItem(),
            {
                trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content: _t(
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>."
                ),
                position: "right",
                edition: "community",
            },
            {
                trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content: _t(
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>."
                ),
                position: "bottom",
                edition: "enterprise",
            },
            {
                trigger: ".o_pos_kanban button.oe_kanban_action_button",
                content: _t(
                    "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"
                ),
                position: "bottom",
            },
            {
                content: "Switch to table or make dummy action",
                trigger:
                    ".table:not(.oe_invisible .neworder-button), .order-button.selected",
                position: "bottom",
                timeout: 20000,
            },
            {
                content: "waiting for loading to finish",
                trigger: ".order-button.neworder-button",
            },
        ];
    }

    function add_product_to_order(product_name) {
        return [
            {
                content: "buy " + product_name,
                trigger: '.product-list .product-name:contains("' + product_name + '")',
            },
            {
                content: "the " + product_name + " have been added to the order",
                trigger: '.order .product-name:contains("' + product_name + '")',
            },
        ];
    }

    function set_customer(name) {
        return [
            {
                trigger: ".button.set-customer",
                content: _t("Open the customer screen"),
            },
            {
                trigger: 'td:contains("' + name + '")',
                content: _t("Click the customer"),
            },
            {
                extra_trigger: '.button.next.highlight:contains("Set Customer")',
                trigger: '.button.next.highlight:contains("Set Customer")',
                content: "Set Customer",
            },
        ];
    }

    function cashier_select() {
        return [
            {
                trigger:
                    '.modal-dialog.cashier .selection-item:contains("Mitchell Admin")',
                content: "select first cashier",
            },
        ];
    }

    function debt_method_paying(pay_method) {
        var steps = [
            {
                content: "Make a dummy action",
                trigger: ".order-button.selected",
            },
            {
                trigger: ".product-screen .actionpad .pay",
                content: _t("Open the payment screen"),
            },
        ];
        if ("pos_choosing_cashier" in odoo.__DEBUG__.services) {
            steps = steps.concat(cashier_select());
        }
        steps = steps.concat([
            {
                extra_trigger: '.button.paymentmethod:contains("' + pay_method + '")',
                trigger: '.button.paymentmethod:contains("' + pay_method + '")',
                content: _t("Click the payment method"),
            },
            {
                extra_trigger: '.button.next.highlight:contains("Validate")',
                trigger: '.button.next.highlight:contains("Validate")',
                content: "Validate payment",
            },
            {
                extra_trigger: ".pos-receipt",
                trigger: '.button.next.highlight:contains("Next Order")',
                content: "Check proceeded validation",
            },
        ]);
        return steps;
    }

    var steps = [];
    steps = steps.concat(open_pos_neworder());
    steps = steps.concat(add_product_to_order("Office Chair"));
    steps = steps.concat(set_customer("Joel Willis"));
    steps = steps.concat(debt_method_paying("Credits"));

    tour.register("tour_pos_debt_notebook_sync", { test: true, url: "/web" }, steps);
});
