# -*- coding: utf-8 -*-
from odoo import fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    kitchen_canceled_only = fields.Boolean(string="Save Kitchen Orders Only",
                                           dafeult=False, help="Save printed orders only")
