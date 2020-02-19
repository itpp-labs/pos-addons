/* Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * Copyright 2019 Kildebekov Anvar <https://it-projects.info/team/kildebekov>
 * License MIT (https://opensource.org/licenses/MIT). */

odoo.define("pos_logout.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");

    function pos_opening() {
        return [
            tour.STEPS.SHOW_APPS_MENU_ITEM,
            {
                trigger:
                    '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content:
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
                position: "right",
                edition: "community",
            },
            {
                trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content:
                    "Ready to launch your <b>point of sale</b>? <i>Click here</i>.",
                position: "bottom",
                edition: "enterprise",
            },
            {
                trigger: ".o_pos_kanban button.oe_kanban_action_button",
                content:
                    "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>",
            },
            {
                trigger: ".o_main_content:has(.loader:hidden)",
                content: "waiting for loading to finish",
                timeout: 20000,
                run: function() {
                    // It's a check
                },
            },
            {
                content: "Switch to table or make dummy action",
                trigger:
                    ".table:not(.oe_invisible .neworder-button), .order-button.selected",
            },
        ];
    }

    function password_prompt(cashier, password) {
        return [
            {
                trigger: ".pos-branding .username",
                content: "Open Cashier popup",
            },
            {
                trigger: ".popup .exit",
                content: "Block POS Screen",
            },
            {
                trigger: ".popups .block",
                content: "Click to unlock the screen",
            },
            {
                trigger:
                    ".modal-dialog:visible .selection-item:contains(" + cashier + ")",
                content: "Change current cashier to tour-cashier",
            },
            {
                trigger: "div.button.cancel",
                content: "Cancel password-prompt",
            },
            {
                trigger: ".popups .block",
                content: "Click to unlock the screen",
            },
            {
                trigger:
                    ".modal-dialog:visible .selection-item:contains(" + cashier + ")",
                content: "Change current cashier to tour-cashier",
            },
            {
                trigger: "div.button.confirm",
                content: "Confirm empty (incorrect) password",
            },
            {
                trigger: "div.popup.popup-error div.button.cancel",
                content: "Close error popup",
            },
            {
                trigger: "div.button.confirm",
                content: "Input password",
                run: function() {
                    for (var i = 0; i < password.length; i++) {
                        $(
                            "div.popup.popup-number.popup-password div.popup-numpad button.input-button.number-char:contains(" +
                                password.charAt(i) +
                                ")"
                        ).click();
                    }
                },
            },
            {
                trigger: "div.button.confirm",
                content: "confirm password",
            },
        ];
    }

    function pos_closing() {
        return [
            {
                trigger: ".header-button",
                content: "close the Point of Sale frontend",
            },
            {
                trigger: ".header-button.confirm",
                content: "confirm closing the frontend",
            },
            {
                content: "wait until backend is opened",
                trigger: ".o_pos_kanban button.oe_kanban_action_button",
                run: function() {
                    // No need to click on trigger
                },
            },
        ];
    }

    var steps = [];
    var username = "test";
    var userpassword = "0000";
    steps = steps.concat(
        pos_opening(),
        password_prompt(username, userpassword),
        pos_closing()
    );

    tour.register("pos_logout_tour", {test: true, url: "/web"}, steps);
});
