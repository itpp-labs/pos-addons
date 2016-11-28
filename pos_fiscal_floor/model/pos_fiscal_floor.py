# -*- coding: utf-8 -*-

from openerp import fields, models


class RestaurantFloor(models.Model):
    _inherit = 'restaurant.floor'
    pos_default_fiscal = fields.Many2one('account.fiscal.position', 'Fiscal Position')
