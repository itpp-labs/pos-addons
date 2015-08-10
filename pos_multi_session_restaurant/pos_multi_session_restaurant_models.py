# -*- coding: utf-8 -*- 
from openerp import api, models, fields, SUPERUSER_ID


class pos_config(models.Model):
    _inherit = 'pos.config'

    multi_session_table_id = fields.Many2one('restaurant.table', 'Virtual table', help='All orders from other POSes would be attached to that table')
