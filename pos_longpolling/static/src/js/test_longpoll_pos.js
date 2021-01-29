odoo.define("pos_longpolling.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");

    var steps = [
        tour.STEPS.SHOW_APPS_MENU_ITEM,
        {
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
            position: "right",
            edition: "community",
        },
        {
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
            position: "bottom",
            edition: "enterprise",
        },
        {
            trigger: ".o_pos_kanban button.oe_kanban_action_button",
            content:
                "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>",
            position: "bottom",
        },
        {
            content: " Notification widget is visible",
            trigger: ".js_poll_connected",
            auto: true,
            timeout: 20000,
        },
    ];

    tour.register("longpoll_connection_tour", {test: true, url: "/web"}, steps);
});
