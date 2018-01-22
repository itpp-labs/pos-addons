# -*- coding: utf-8 -*-
from odoo import fields, models


class BaseConfigSettings(models.TransientModel):
    _inherit = 'base.config.settings'

    group_attendance_use_pin = fields.Selection([(0, 'Partners do not need to enter their PIN to check in manually in the "Kiosk Mode".'),
                                                 (1, 'Partners must enter their PIN to check in manually in the "Kiosk Mode".')],
                                                string='Partner PIN',
                                                help='Enable or disable partner PIN identification at check in',
                                                implied_group="base_attendance.group_hr_attendance_use_pin")
