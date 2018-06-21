# -*- coding: utf-8 -*-
# Copyright (c) 2004-2015 Odoo S.A.
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from datetime import datetime

from odoo import models, fields, api, exceptions, _
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT


class HrAttendance(models.Model):
    _name = "res.partner.attendance"
    _description = "Attendance"
    _order = "check_in desc"

    def _default_partner(self):
        return self.env['res.partner'].search([('user_id', '=', self.env.uid)], limit=1)

    partner_id = fields.Many2one('res.partner', string="Partner", default=_default_partner, required=True, ondelete='cascade', index=True)
    check_in = fields.Datetime(string="Check In", default=fields.Datetime.now, required=True)
    check_out = fields.Datetime(string="Check Out")
    worked_hours = fields.Float(string='Worked Hours', compute='_compute_worked_hours', store=True, readonly=True)

    @api.multi
    def name_get(self):
        result = []
        for attendance in self:
            if not attendance.check_out:
                result.append((attendance.id, _("%(partner_name)s from %(check_in)s") % {
                    'partner_name': attendance.partner_id.name,
                    'check_in': fields.Datetime.to_string(fields.Datetime.context_timestamp(attendance, fields.Datetime.from_string(attendance.check_in))),
                }))
            else:
                int_worked_hours = int(attendance.worked_hours)
                worked_time = "%02dh:%02dm" % (int_worked_hours, (attendance.worked_hours - int_worked_hours) * 60)
                result.append((attendance.id, _("%(worked_time)s by %(partner_name)s from %(check_in)s to %(check_out)s") % {
                    'worked_time': worked_time,
                    'partner_name': attendance.partner_id.name,
                    'check_in': fields.Datetime.to_string(fields.Datetime.context_timestamp(attendance, fields.Datetime.from_string(attendance.check_in))),
                    'check_out': fields.Datetime.to_string(fields.Datetime.context_timestamp(attendance, fields.Datetime.from_string(attendance.check_out))),
                }))
        return result

    @api.depends('check_in', 'check_out')
    def _compute_worked_hours(self):
        for attendance in self:
            if attendance.check_out:
                delta = datetime.strptime(attendance.check_out, DEFAULT_SERVER_DATETIME_FORMAT) - datetime.strptime(
                    attendance.check_in, DEFAULT_SERVER_DATETIME_FORMAT)
                attendance.worked_hours = delta.total_seconds() / 3600.0

    @api.constrains('check_in', 'check_out')
    def _check_validity_check_in_check_out(self):
        """ verifies if check_in is earlier than check_out. """
        for attendance in self:
            if attendance.check_in and attendance.check_out:
                if attendance.check_out < attendance.check_in:
                    raise exceptions.ValidationError(_('"Check Out" time cannot be earlier than "Check In" time.'))

    @api.constrains('check_in', 'check_out', 'partner_id')
    def _check_validity(self):
        """ Verifies the validity of the attendance record compared to the others from the same partner.
            For the same partner we must have :
                * maximum 1 "open" attendance record (without check_out)
                * no overlapping time slices with previous partner records
        """
        for attendance in self:
            # we take the latest attendance before our check_in time and check it doesn't overlap with ours
            last_attendance_before_check_in = self.env['res.partner.attendance'].search([
                ('partner_id', '=', attendance.partner_id.id),
                ('check_in', '<=', attendance.check_in),
                ('id', '!=', attendance.id),
            ], order='check_in desc', limit=1)
            if last_attendance_before_check_in and last_attendance_before_check_in.check_out and last_attendance_before_check_in.check_out > attendance.check_in:
                raise exceptions.ValidationError(_("Cannot create new attendance record for %(partner_name)s, the partner was already checked in on %(datetime)s") % {
                    'partner_name': attendance.partner_id.name,
                    'datetime': fields.Datetime.to_string(fields.Datetime.context_timestamp(self, fields.Datetime.from_string(attendance.check_in))),
                })

            if not attendance.check_out:
                # if our attendance is "open" (no check_out), we verify there is no other "open" attendance
                no_check_out_attendances = self.env['res.partner.attendance'].search([
                    ('partner_id', '=', attendance.partner_id.id),
                    ('check_out', '=', False),
                    ('id', '!=', attendance.id),
                ])
                if no_check_out_attendances:
                    raise exceptions.ValidationError(_("Cannot create new attendance record for %(partner_name)s, the partner hasn't checked out since %(datetime)s") % {
                        'partner_name': attendance.partner_id.name,
                        'datetime': fields.Datetime.to_string(fields.Datetime.context_timestamp(self, fields.Datetime.from_string(no_check_out_attendances.check_in))),
                    })
            else:
                # we verify that the latest attendance with check_in time before our check_out time
                # is the same as the one before our check_in time computed before, otherwise it overlaps
                last_attendance_before_check_out = self.env['res.partner.attendance'].search([
                    ('partner_id', '=', attendance.partner_id.id),
                    ('check_in', '<', attendance.check_out),
                    ('id', '!=', attendance.id),
                ], order='check_in desc', limit=1)
                if last_attendance_before_check_out and last_attendance_before_check_in != last_attendance_before_check_out:
                    raise exceptions.ValidationError(_("Cannot create new attendance record for %(partner_name)s, the partner was already checked in on %(datetime)s") % {
                        'partner_name': attendance.partner.name,
                        'datetime': fields.Datetime.to_string(fields.Datetime.context_timestamp(self, fields.Datetime.from_string(last_attendance_before_check_out.check_in))),
                    })

    @api.multi
    def copy(self):
        # super here is called by the reason of LINT error:
        # [W8106(method-required-super), HrAttendance.copy] Missing `super` call in "copy" method.
        super(HrAttendance, self).copy()
        raise exceptions.UserError(_('You cannot duplicate an attendance.'))
