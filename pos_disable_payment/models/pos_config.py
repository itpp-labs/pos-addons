# -*- coding: utf-8 -*- 
from openerp import api, models, fields, SUPERUSER_ID


class PosConfig(models.Model):
    _inherit = 'pos.config'

    allow_payments = fields.Boolean('Allow payments', default=True)
    
