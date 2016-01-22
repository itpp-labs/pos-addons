# -*- coding: utf-8 -*- 
from openerp import api, models, fields, SUPERUSER_ID


class pos_config(models.Model):
    _inherit = 'pos.config'

    multi_session_table_id = fields.Many2one('restaurant.table', 'Default table', help='Real or Virtual table that is used for orders that had not been attached to any of tables')
