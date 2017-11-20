# -*- coding: utf-8 -*-
from odoo import fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    reprint_button = fields.Boolean("Reprint Button", help="Check the box for available the Reprint Button"
                                                           " in Orders History screen", default=True)
