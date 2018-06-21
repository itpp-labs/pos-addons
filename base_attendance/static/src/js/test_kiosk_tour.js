/* Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
   License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('base_attendance.tour', function (require) {
    "use strict";

    var tour = require("web_tour.tour");
    var core = require('web.core');
    var _t = core._t;

    function partner_check_in_out(partner, color) {
        return [{
            extra_trigger: '.o_hr_attendance_kiosk_mode_container',
            trigger: '.o_hr_attendance_button_partners:contains("Select Partner")',
            content: 'Click Select Partner button',
        }, {
            trigger: '.oe_kanban_global_click.o_kanban_record:contains(' + partner + ') ' +
            '.oe_hr_attendance_status.fa.fa-user.oe_hr_attendance_status_' + color,
            content: 'Select Partner',
        }, {
            trigger: '.fa.btn-primary.o_hr_attendance_sign_in_out_icon.fa-sign-out.fa-sign-out',
            content: 'Check in',
        }, {
            trigger: 'button:contains("ok")',
            content: 'Validate',
        }];
    }

    var steps = [{
            trigger: 'a.oe_menu_toggler:contains("Attendance")',
            content: _t("Click to enter menu attendances"),
            position: 'bottom',
        }, {
            trigger: 'a.oe_menu_leaf:contains("Kiosk")',
            content: _t("Click to enter Kiosk"),
        }];

    steps = steps.concat(partner_check_in_out("Laith Jubair", 'red'));
    steps = steps.concat(partner_check_in_out("Laith Jubair", 'green'));

    tour.register('test_kiosk_tour', { test: true, url: '/web' }, steps);
});
