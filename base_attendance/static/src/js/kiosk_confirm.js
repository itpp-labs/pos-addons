/* Copyright (c) 2004-2015 Odoo S.A.
   Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
   License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('base_attendance.kiosk_confirm', function (require) {
"use strict";

var core = require('web.core');
var Model = require('web.Model');
var Widget = require('web.Widget');

var QWeb = core.qweb;
var _t = core._t;


var KioskConfirm = Widget.extend({
    events: {
        "click .o_hr_attendance_back_button": function () {
            this.do_action(this.next_action, {clear_breadcrumbs: true});
        },
        "click .o_hr_attendance_sign_in_out_icon": function () {
            var self = this;
            this.$('.o_hr_attendance_sign_in_out_icon').attr("disabled", "disabled");
            var hr_partner = new Model('res.partner');
            hr_partner.call('attendance_manual', [[this.partner_id], this.next_action]).
            then(function(result) {
                if (result.action) {
                    self.do_action(result.action);
                } else if (result.warning) {
                    self.do_warn(result.warning);
                    self.$('.o_hr_attendance_sign_in_out_icon').removeAttr("disabled");
                }
            });
        },
        'click .o_hr_attendance_pin_pad_button_0': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 0);
        },
        'click .o_hr_attendance_pin_pad_button_1': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 1);
        },
        'click .o_hr_attendance_pin_pad_button_2': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 2);
        },
        'click .o_hr_attendance_pin_pad_button_3': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 3);
        },
        'click .o_hr_attendance_pin_pad_button_4': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 4);
        },
        'click .o_hr_attendance_pin_pad_button_5': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 5);
        },
        'click .o_hr_attendance_pin_pad_button_6': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 6);
        },
        'click .o_hr_attendance_pin_pad_button_7': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 7);
        },
        'click .o_hr_attendance_pin_pad_button_8': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 8);
        },
        'click .o_hr_attendance_pin_pad_button_9': function() {
            this.$('.o_hr_attendance_PINbox').val(this.$('.o_hr_attendance_PINbox').val() + 9);
        },
        'click .o_hr_attendance_pin_pad_button_C': function() {
            this.$('.o_hr_attendance_PINbox').val('');
        },
        'click .o_hr_attendance_pin_pad_button_ok': function() {
            var self = this;
            this.$('.o_hr_attendance_pin_pad_button_ok').attr("disabled", "disabled");
            var hr_partner = new Model('res.partner');
            hr_partner.call('attendance_manual', [[this.partner_id], this.next_action, this.$('.o_hr_attendance_PINbox').val()]).
            then(function(result) {
                if (result.action) {
                    self.do_action(result.action);
                } else if (result.warning) {
                    self.do_warn(result.warning);
                    setTimeout( function() {
                        self.$('.o_hr_attendance_pin_pad_button_ok').removeAttr("disabled");
                    }, 500);
                }
            });
        },
    },

    init: function (parent, action) {
        this._super.apply(this, arguments);
        this.next_action = 'base_attendance.hr_attendance_action_kiosk_mode';
        this.partner_id = action.partner_id;
        this.partner_name = action.partner_name;
        this.partner_state = action.partner_state;
        var self = this;
    },

    start: function () {
        var self = this;
        self.session.user_has_group('base_attendance.group_hr_attendance_use_pin').then(function(has_group){
            self.use_pin = has_group;
            self.$el.html(QWeb.render("BaseAttendanceKioskConfirm", {widget: self}));
            self.start_clock();
        });
        return self._super.apply(this, arguments);
    },

    start_clock: function () {
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

core.action_registry.add('base_attendance_kiosk_confirm', KioskConfirm);

return KioskConfirm;

});
