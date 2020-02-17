/*  Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/kolushovalexandr>
    Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_keyboard.tour", function(require) {
    "use strict";

    var tour = require("web_tour.tour");
    var core = require("web.core");
    var _t = core._t;

    function get_steps_for_hr() {
        return [
            {
                trigger: "ul.o_menu_apps li.dropdown a.full",
                content: _t("Show Apps Menu"),
                position: "bottom",
            },
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
        ];
    }

    function open_pos() {
        var steps = [
            {
                trigger: "ul.o_menu_apps li.dropdown a.full",
                content: _t("Show Apps Menu"),
                position: "bottom",
            },
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
        ];
        var hr_steps = window.posmodel && window.posmodel.config.module_pos_hr;
        if (hr_steps) {
            steps = steps.concat(get_steps_for_hr());
        }
        steps = steps.concat({
            content: "New Order",
            trigger: ".neworder-button",
        });
        steps[3].timeout = 30000;
        return steps;
    }

    function simulate_event(ev, key, keyCode) {
        var event = $.Event(ev);
        keyCode = keyCode || key;
        event.key = key;
        event.which = key;
        event.keyCode = keyCode;
        $("body").trigger(event);
    }

    function change_mode(mode) {
        var key = false;
        var keyCode = false;
        switch (mode) {
            case "price":
                key = "p";
                keyCode = 80;
                break;
            case "discount":
                key = "d";
                keyCode = 68;
                break;
            case "quantity":
                key = "q";
                keyCode = 81;
                break;
        }
        return [
            {
                content: "Click on the Mode Button" + mode,
                trigger: ".order-button.selected",
                run: function() {
                    simulate_event("keydown", key, keyCode);
                },
            },
            {
                content: "Check it was Selected",
                trigger: '.mode-button.selected-mode[data-mode="' + mode + '"]',
            },
        ];
    }

    function open_password_popup(value) {
        window.posmodel.gui.show_popup("password", {
            confirm: function(val) {
                if (val !== String(value)) {
                    console.log("error");
                }
            },
        });
    }

    function check_popup_behavior(value) {
        return [
            {
                content: "Open Password Pop-up",
                trigger: ".order-button.selected",
                run: function() {
                    open_password_popup(value);
                },
            },
            {
                content: "Click on Number",
                trigger: ".popup.popup-number.popup-password:visible .title",
                run: function() {
                    simulate_event("keyup", 96 + value);
                },
            },
            {
                content: "Click Enter",
                trigger: ".popup.popup-number.popup-password:visible .title",
                run: function() {
                    simulate_event("keyup", 13);
                },
            },
        ];
    }

    var steps = [];
    steps = steps.concat(
        open_pos(),
        check_popup_behavior(2),
        change_mode("discount"),
        change_mode("price"),
        change_mode("quantity")
    );

    tour.register("pos_keyboard_tour", {test: true, url: "/web"}, steps);
});
