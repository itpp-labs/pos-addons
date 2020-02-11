odoo.define("pos_disable_payment_restaurant.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");

    tour.register(
        "pos_disable_payment_restaurant_tour",
        {
            test: true,
            url: "/web",
        },
        [
            {
                trigger: '.o_app[data-menu="4"], .oe_menu_toggler[data-menu="4"]',
                content: "Configuration options are available in the Settings app.",
                position: "bottom",
            },
            {
                trigger: ".oe_menu_leaf[data-menu=65]",
                content: "Open the <b>Users</b> menu",
                position: "right",
            },
            {
                trigger: ".o_list_view > tbody > tr",
                content: "Click on the item",
                position: "bottom",
            },
            {
                trigger: ".o_form_button_edit",
                content: "Click to edit user",
                position: "bottom",
            },
            {
                trigger: 'a[href="#notebook_page_12"]',
                content: "Move on <b>Point of Sale</b> tab",
                position: "top",
            },
            {
                trigger: 'label:contains("Allow change Qty for kitchen orders")',
                extra_trigger:
                    'input[name="allow_decrease_kitchen"]:propChecked({disabled: true})',
                content: "Uncheck the box <b>Allow change Qty for kitchen orders</b>",
                position: "right",
            },
            {
                trigger: ".o_form_button_save",
                content: "Save the changes",
                position: "bottom",
            },
            {
                trigger:
                    '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content:
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
                position: "bottom",
            },
            {
                trigger: ".o_pos_kanban button.oe_kanban_action_button",
                content:
                    "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>",
                position: "bottom",
            },
            {
                trigger: ".o_main_content:has(.loader:hidden)",
                content: "Wait for loading is finished",
                timeout: 20000,
                run: function() {
                    // It's a check
                },
            },
            {
                content: "Switch to table or make dummy action",
                trigger:
                    ".table:not(.oe_invisible .neworder-button), .order-button.selected",
                position: "bottom",
            },
            {
                trigger: '.product-list .product[data-product-id="40"]',
                content: "Add the product",
                position: "top",
            },
            {
                trigger: ".control-buttons .order-submit",
                content: "Send the order to kitchen",
                position: "top",
            },
            {
                trigger: ".pads",
                content: "The option to change Qty for kitchen orders is blocked",
                timeout: 20000,
                run: function() {
                    if (
                        $(".numpad")
                            .find(".number-char")
                            .hasClass("disable")
                    ) {
                        console.log(
                            "The option to change Qty for kitchen orders is blocked"
                        );
                    } else {
                        console.log("The button is not disabled");
                    }
                },
            },
        ]
    );
});
