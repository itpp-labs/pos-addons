# -*- coding: utf-8 -*-
from odoo import models, fields


class RestaurantFloor(models.Model):
    _inherit = 'restaurant.floor'

    pos_multi_session_ids = fields.Many2many('pos.multi_session', 'pos_multi_session_floor_rel', 'floor_id', 'pos_multi_session_id')


class PosConfig(models.Model):
    _inherit = 'pos.config'

    floor_ids = fields.Many2many(related='multi_session_id.floor_ids')


class PosMultiSession(models.Model):
    _inherit = 'pos.multi_session'

    floor_ids = fields.Many2many('restaurant.floor', 'pos_multi_session_floor_rel', 'pos_multi_session_id', 'floor_id')
