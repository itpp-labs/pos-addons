# -*- coding: utf-8 -*-
from odoo import fields, models, api, _
from functools import partial
from datetime import datetime
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT as DF


class PosConfig(models.Model):
    _inherit = 'pos.config'

    kitchen_canceled_only = fields.Boolean(string="Save kitchen orders",
                                           dafeult=False, help="Canceled orders: "
                                                               "save kitchen orders only")
