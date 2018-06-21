# -*- coding: utf-8 -*-
# Copyright (c) 2004-2015 Odoo S.A.
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import fields, models


class BaseConfigSettings(models.TransientModel):
    _inherit = 'base.config.settings'

    group_attendance_use_pin = fields.Selection([(0, 'Partners do not need to enter their PIN to check in manually in the "Kiosk Mode".'),
                                                 (1, 'Partners must enter their PIN to check in manually in the "Kiosk Mode".')],
                                                string='Partner PIN',
                                                help='Enable or disable partner PIN identification at check in',
                                                implied_group="base_attendance.group_hr_attendance_use_pin")
