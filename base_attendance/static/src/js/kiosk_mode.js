/* Copyright (c) 2004-2015 Odoo S.A.
   Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
   License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('base_attendance.kiosk_mode', function (require) {
"use strict";

var core = require('web.core');
var Model = require('web.Model');
var Widget = require('web.Widget');
var Session = require('web.session');
var BarcodeHandlerMixin = require('barcodes.BarcodeHandlerMixin');

var QWeb = core.qweb;
var _t = core._t;


var KioskMode = Widget.extend(BarcodeHandlerMixin, {
    events: {
        "click .o_hr_attendance_button_partners": function(){
            this.do_action('base_attendance.res_partner_action_kanban_view');
        },
    },

    init: function (parent, action) {
        // Note: BarcodeHandlerMixin.init calls this._super.init, so there's no need to do it here.
        // Yet, "_super" must be present in a function for the class mechanism to replace it with the actual parent method.
        // We added a local variable for this._super in order to fix the nextLINT error
        //"Expected an assignment or function call and instead saw an expression. [Error/no-unused-expressions]"
        var init_super = this._super;
        BarcodeHandlerMixin.init.apply(this, arguments);
    },

    start: function () {
        var self = this;
        self.session = Session;
        var res_company = new Model('res.company');
        res_company.query(['name']).
           filter([['id', '=', self.session.company_id]]).
           all().
           then(function (companies){
                self.company_name = companies[0].name;
                self.company_image_url = self.session.url('/web/image', {model: 'res.company', id: self.session.company_id, field: 'logo',});
                self.$el.html(QWeb.render("BaseAttendanceKioskMode", {widget: self}));
                self.start_clock();
            });
        return self._super.apply(this, arguments);
    },

    on_barcode_scanned: function(barcode) {
        var self = this;
        var hr_employee = new Model('res.partner');
        hr_employee.call('attendance_scan', [barcode, ]).
            then(function (result) {
                if (result.action) {
                    self.do_action(result.action);
                } else if (result.warning) {
                    self.do_warn(result.warning);
                }
            });
    },

    start_clock: function() {
        this.clock_start = setInterval(function() {
            this.$(".o_hr_attendance_clock").text(new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'}));
        }, 700);
        // First clock refresh before interval to avoid delay
        this.$(".o_hr_attendance_clock").text(new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'}));
    },

    destroy: function () {
        clearInterval(this.clock_start);
        this._super.apply(this, arguments);
    },
});

core.action_registry.add('base_attendance_kiosk_mode', KioskMode);

return KioskMode;

});
