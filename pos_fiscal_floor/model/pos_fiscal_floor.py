# -*- coding: utf-8 -*-

from openerp.osv import fields, osv
from openerp import models


class restaurant_floor(osv.Model):
    _inherit = 'restaurant.floor'
    _columns = {'pos_default_fiscal': fields.many2one('account.fiscal.position', 'Fiscal Position')}
