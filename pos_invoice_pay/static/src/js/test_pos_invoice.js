//  Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
//  License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
odoo.define('pos_invoice_pay.tour', function (require) {
    "use strict";

    var tour = require("web_tour.tour");
    var core = require('web.core');
    var _t = core._t;

    function open_pos_neworder() {
        return [{
            trigger: ".o_pos_kanban button.oe_kanban_action_button",
            content: _t("<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"),
            position: "bottom"
        }, {
            content: "Switch to table or make dummy action",
            trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
            position: "bottom",
            timeout: 15000,
        }, {
            content: 'waiting for loading to finish',
            trigger: '.order-button.neworder-button',
        }];
    }

    function select_invoice() {
        return [{
            content: 'Open Invoices',
            trigger: '.subwindow-container-fix.pads .control-button:contains("Fetch Invoices")',
        }, {
            content: "Choose Administrator",
            trigger: '.modal-dialog:not(.oe_hidden) .popup-selection .selection-item:contains("Administrator")',
        }, {
            content: "Select Invoice",
            trigger: '#invoice_list_screen tbody.client-list-contents tr.invoice:first',
        }, {
            content: "Click next",
            trigger: '#invoice_list_screen .button.next.highlight',
        }];
    }

    function max_payment(pay_method) {
        return [{
            extra_trigger: '.button.paymentmethod:contains("' + pay_method +'")',
            trigger: '.button.paymentmethod:contains("' + pay_method +'")',
            content: _t("Click the payment method"),
        }, {
            trigger: '.payment-screen:not(".oe_hidden") .numpad button[data-action="9"]',
            content: 'Set payment amount',
        }, {
            trigger: '.payment-screen:not(".oe_hidden") .numpad button[data-action="9"]',
            content: 'Set payment amount',
        }, {
            trigger: '.payment-screen:not(".oe_hidden") .numpad button[data-action="9"]',
            content: 'Set payment amount',
        }, {
            trigger: '.payment-screen:not(".oe_hidden") .numpad button[data-action="9"]',
            content: 'Set payment amount',
        }, {
            extra_trigger: '.button.next.highlight:contains("Validate")',
            trigger: '.button.next.highlight:contains("Validate")',
            content: 'Validate payment',
        }, {
            extra_trigger: '.pos-sale-ticket',
            trigger: '.button.next.highlight:contains("Next Order")',
            content: 'Check proceeded validation',
        }];
    }

    var steps = [{
            trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
            content: _t("Ready to launch your <b>point of sale</b>? <i>Click here</i>."),
            position: 'bottom',
        }];

    steps = steps.concat(open_pos_neworder());
    steps = steps.concat(select_invoice());
    steps = steps.concat(max_payment('Cash (USD)'));

    tour.register('tour_pos_invoice_pay', { test: true, url: '/web' }, steps);

});
