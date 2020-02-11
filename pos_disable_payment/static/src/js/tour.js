odoo.define("pos_disable_payment.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");

    tour.register(
        "pos_disable_payment_tour",
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
                trigger: 'label:contains("Allow refunds")',
                extra_trigger:
                    'input[name="allow_refund"]:propChecked({disabled: true})',
                content: "Uncheck the box <b>Allow refunds</b>",
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
                content: "Switch to table or make dummy action",
                trigger:
                    ".table:not(.oe_invisible .neworder-button), .order-button.selected",
                position: "bottom",
            },
            {
                trigger: ".product-list .product",
                content: "Add the first product",
                position: "top",
            },
            {
                content: "Hidden",
                trigger: ".pads",
                run: function() {
                    if (!$(".numpad-minus").css("visibility") === "hidden") {
                        console.log("error", "The button is not hidden");
                    } else {
                        console.log("Refunding feature is blocked as configured");
                    }
                },
            },
        ]
    );
});
