# -*- coding: utf-8 -*-
# Copyright (c) 2004-2015 Odoo S.A.
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from random import choice
from string import digits

from odoo import models, fields, api, exceptions, _, SUPERUSER_ID


class HrPartner(models.Model):
    _inherit = "res.partner"
    _description = "Partner"

    def _default_random_pin(self):
        return ("".join(choice(digits) for i in range(4)))

    # def _default_random_barcode(self):
    #     barcode = None
    #     while not barcode or self.env['res.partner'].search([('barcode', '=', barcode)]):
    #         barcode = "".join(choice(digits) for i in range(8))
    #     return barcode

    # barcode = fields.Char(string="Badge ID", help="ID used for partner identification.",
    #                       default=_default_random_barcode, copy=False)
    pin = fields.Char(string="Attendance PIN", default=_default_random_pin,
                      help="PIN used to Check In/Out in Kiosk Mode (if enabled in Configuration).", copy=False)

    partners_attendance_ids = fields.One2many('res.partner.attendance', 'partner_id',
                                              help='list of attendances for the employee')
    last_attendance_id = fields.Many2one('res.partner.attendance', compute='_compute_last_attendance_id')
    attendance_state = fields.Selection(string="Attendance", compute='_compute_attendance_state',
                                        selection=[('checked_out', "Checked out"), ('checked_in', "Checked in")])

    # _sql_constraints = [('barcode_uniq', 'unique (barcode)',
    #                      "The Badge ID must be unique, this one is already assigned to another employee.")]

    @api.depends('partners_attendance_ids')
    def _compute_last_attendance_id(self):
        for partner in self:
            partner.last_attendance_id = partner.partners_attendance_ids and partner.partners_attendance_ids[0] or False

    @api.depends('last_attendance_id.check_in', 'last_attendance_id.check_out', 'last_attendance_id')
    def _compute_attendance_state(self):
        for partner in self:
            partner.attendance_state = partner.last_attendance_id and not partner.last_attendance_id.check_out and 'checked_in' or 'checked_out'

    @api.constrains('pin')
    def _verify_pin(self):
        for partner in self:
            if partner.pin and not partner.pin.isdigit():
                raise exceptions.ValidationError(_("The PIN must be a sequence of digits."))

    @api.model
    def attendance_scan(self, barcode):
        """ Receive a barcode scanned from the Kiosk Mode and change the attendances of corresponding partner.
            Returns either an action or a warning.
        """
        partner = self.search([('barcode', '=', barcode)], limit=1)
        return partner and partner.attendance_action('base_attendance.hr_attendance_action_kiosk_mode') or \
            {'warning': _('No partner corresponding to barcode %(barcode)s') % {'barcode': barcode}}

    @api.multi
    def attendance_manual(self, next_action, entered_pin=None):
        self.ensure_one()
        if not (entered_pin is None) or \
                self.env['res.users'].browse(SUPERUSER_ID).has_group('hr_partner_attendance.group_hr_attendance_use_pin'):
            if entered_pin != self.pin:
                return {'warning': _('Wrong PIN')}
        return self.attendance_action(next_action)

    @api.multi
    def attendance_action(self, next_action):
        """ Changes the attendance of the partner.
            Returns an action to the check in/out message,
            next_action defines which menu the check in/out message should return to. ("My Attendances" or "Kiosk Mode")
        """
        self.ensure_one()
        action_message = self.env.ref('base_attendance.hr_attendance_action_greeting_message').read()[0]
        action_message['previous_attendance_change_date'] = self.last_attendance_id and (self.last_attendance_id.check_out or self.last_attendance_id.check_in) or False
        action_message['partner_name'] = self.name
        action_message['next_action'] = next_action
        modified_attendance = self.sudo().attendance_action_change()
        action_message['attendance'] = modified_attendance.read()[0]
        return {'action': action_message}

    @api.multi
    def attendance_action_change(self):
        """ Check In/Check Out action
            Check In: create a new attendance record
            Check Out: modify check_out field of appropriate attendance record
        """
        if len(self) > 1:
            raise exceptions.UserError(_('Cannot perform check in or check out on multiple partners.'))
        action_date = fields.Datetime.now()

        if self.attendance_state != 'checked_in':
            vals = {
                'partner_id': self.id,
                'check_in': action_date,
            }
            return self.env['res.partner.attendance'].create(vals)
        else:
            attendance = self.env['res.partner.attendance'].search([('partner_id', '=', self.id), ('check_out', '=', False)], limit=1)
            if attendance:
                attendance.check_out = action_date
            else:
                raise exceptions.UserError(_('Cannot perform check out on %(empl_name)s, could not find corresponding check in. '
                                             'Your attendances have probably been modified manually by human resources.') % {'empl_name': self.name, })
            return attendance

    @api.model_cr_context
    def _init_column(self, column_name):
        """ Initialize the value of the given column for existing rows.
            Overridden here because we need to have different default values
            for barcode and pin for every partner.
        """
        # if column_name not in ["barcode", "pin"]:
        if column_name not in ["pin"]:
            super(HrPartner, self)._init_column(column_name)
        else:
            default_compute = self._fields[column_name].default

            query = 'SELECT id FROM "%s" WHERE "%s" is NULL' % (
                self._table, column_name)
            self.env.cr.execute(query)
            partner_ids = self.env.cr.fetchall()

            for partner_id in partner_ids:
                default_value = default_compute(self)

                query = 'UPDATE "%s" SET "%s"=%%s WHERE id = %s' % (
                    self._table, column_name, partner_id[0])
                self.env.cr.execute(query, (default_value,))
