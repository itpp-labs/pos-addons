# -*- coding: utf-8 -*- 
from openerp import api, models, fields, SUPERUSER_ID


class pos_config(models.Model):
    _inherit = 'pos.config'

    allow_payments = fields.Boolean('Allow Payments', default=True)
