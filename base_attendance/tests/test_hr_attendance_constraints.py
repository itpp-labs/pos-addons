# -*- coding: utf-8 -*-
# Copyright (c) 2004-2015 Odoo S.A.
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo.tests.common import TransactionCase
import time


class TestHrAttendance(TransactionCase):
    """Tests for attendance date ranges validity"""

    def setUp(self):
        super(TestHrAttendance, self).setUp()
        self.attendance = self.env['res.partner.attendance']
        self.test_partner = self.env['res.partner'].search([('name', '=', 'David Simpson')])

    def test_attendance_in_before_out(self):
        # Make sure check_out is before check_in
        with self.assertRaises(Exception):
            self.my_attend = self.attendance.create({
                'partner_id': self.test_partner.id,
                'check_in': time.strftime('%Y-%m-10 12:00'),
                'check_out': time.strftime('%Y-%m-10 11:00'),
            })

    def test_attendance_no_check_out(self):
        # Make sure no second attendance without check_out can be created
        self.attendance.create({
            'partner_id': self.test_partner.id,
            'check_in': time.strftime('%Y-%m-10 10:00'),
        })
        with self.assertRaises(Exception):
            self.attendance.create({
                'partner_id': self.test_partner.id,
                'check_in': time.strftime('%Y-%m-10 11:00'),
            })

    def test_check_in_while_attendance(self):
        # Make sure attendance no check in while attendance is on
        self.attendance.create({
            'partner_id': self.test_partner.id,
            'check_in': time.strftime('%Y-%m-10 08:00'),
            'check_out': time.strftime('%Y-%m-10 09:30'),
        })
        with self.assertRaises(Exception):
            self.attendance.create({
                'partner_id': self.test_partner.id,
                'check_in': time.strftime('%Y-%m-10 08:30'),
                'check_out': time.strftime('%Y-%m-10 09:30'),
            })

    def test_new_attendances(self):
        # Make sure attendance modification raises an error when it causes an overlap
        self.attendance.create({
            'partner_id': self.test_partner.id,
            'check_in': time.strftime('%Y-%m-10 11:00'),
            'check_out': time.strftime('%Y-%m-10 12:00'),
        })
        open_attendance = self.attendance.create({
            'partner_id': self.test_partner.id,
            'check_in': time.strftime('%Y-%m-10 10:00'),
        })
        with self.assertRaises(Exception):
            open_attendance.write({
                'check_out': time.strftime('%Y-%m-10 11:30'),
            })
