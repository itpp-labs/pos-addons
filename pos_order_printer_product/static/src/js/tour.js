odoo.define("pos_order_printer_product.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");

    tour.register(
        "pos_order_printer_product_tour",
        {
            url: "/web",
            test: true,
        },
        [
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
                trigger: ".tables .table",
                content: "<p>Click <b>table</b></p>",
                position: "bottom",
                timeout: 20000,
            },
            {
                trigger: "span[data-category-id='1']",
                content: "<p>Click <b>Fruits and Vegetables</b> category.</p>",
                position: "bottom",
            },
            {
                trigger: ".product-list .product",
                content: "<p>Click product 1</p>",
                position: "bottom",
            },
            {
                trigger: ".product-list .product-name:contains('Boni Oranges')",
                content: "<p>Buy Boni Oranges </p>",
                position: "bottom",
            },
            {
                trigger: ".order .product-name:contains('Boni Oranges')",
                content: "The product Boni Oranges has been added to the order",
                position: "bottom",
            },
            {
                trigger: ".control-buttons .order-submit",
                content:
                    "<p>Click <b>Order</b> button for printing in <b>Kitchen</b></p>",
                position: "bottom",
            },
        ]
    );
});
