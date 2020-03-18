/*  Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/kolushovalexandr>
    Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_keyboard.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");
    var core = require("web.core");
    var _t = core._t;

    function open_pos_neworder() {
        return [
            {
                trigger:
                    '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content: _t(
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>."
                ),
                position: "bottom",
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
                timeout: 30000,
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

    function simulate_keyup_event(number) {
        var event = $.Event("keyup");
        event.which = number;
        event.keyCode = number;
        $("body").trigger(event);
    }

    function update_qty_for_product(qty) {
        return [
            {
                content: "Make dummy action and update product qty",
                trigger: ".order-button.selected",
                run: function() {
                    simulate_keyup_event(96 + qty);
                },
            },
            {
                content: "Check the qty",
                trigger: ".orderline.selected .info em:contains(" + qty + ")",
            },
        ];
    }

    function connect_disconnect_keyboard() {
        var stps = [
            {
                content: "Open Payment-Screen",
                trigger: ".pay-circle",
            },
        ];

        if (odoo._modules.indexOf("pos_cashier_select") !== -1) {
            stps = stps.concat([
                {
                    trigger: '.modal-dialog.cashier .selection-item:contains("Admin")',
                    content: "select first cashier",
                },
            ]);
        }

        stps = stps.concat([
            {
                content: "Close Payment-Screen",
                trigger: ".button:contains(Back)",
            },
        ]);
        return stps;
    }

    function open_cashier_popup_and_close_it() {
        return [
            {
                content: "Open cashier selection popup",
                trigger: ".username",
            },
            {
                content: "Make dummy action and simulate escape button clicking",
                trigger: '.modal-dialog:not(".oe_hidden")',
                run: function() {
                    simulate_keyup_event(27);
                    setTimeout(function() {
                        if ($('.modal-dialog:not(".oe_hidden")').length) {
                            console.log("error");
                        } else {
                            console.log("ok");
                        }
                    }, 50);
                },
            },
            {
                content:
                    "Make dummy action in order to properly pass the check for closed popups",
                trigger: ".order-button.selected",
            },
        ];
    }

    var steps = [];
    var quantity = 3;
    steps = steps.concat(open_pos_neworder());
    steps = steps.concat(add_product_to_order("Miscellaneous"));
    steps = steps.concat(update_qty_for_product(quantity));
    steps = steps.concat(connect_disconnect_keyboard());
    steps = steps.concat(update_qty_for_product(quantity + 1));
    steps = steps.concat(open_cashier_popup_and_close_it());

    tour.register("pos_keyboard_tour", {test: true, url: "/web"}, steps);
});
