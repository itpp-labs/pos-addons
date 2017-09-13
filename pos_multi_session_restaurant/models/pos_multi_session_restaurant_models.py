# -*- coding: utf-8 -*-
from odoo import models, fields


class RestaurantFloor(models.Model):
    _inherit = 'restaurant.floor'

    pos_multi_session_ids = fields.Many2many('pos.multi_session', 'pos_multi_session_floor_rel', 'floor_id', 'pos_multi_session_id')


class PosMultiSession(models.Model):
    _inherit = 'pos.multi_session'

    floor_ids = fields.Many2many('restaurant.floor', 'pos_multi_session_floor_rel', 'pos_multi_session_id', 'floor_id',
                                 string='Restaurant Floors', help='The restaurant floors served by this point of sale')


# class PosConfig(models.Model):
#     _inherit = 'pos.config'
#
#     multi_session_floors = fields.Many2many(related='pos.multi_session', store=True)
#     floor_ids = fields.One2many('restaurant.floor', 'pos_config_id', string='Restaurant Floors', help='The restaurant floors served by this point of sale')

