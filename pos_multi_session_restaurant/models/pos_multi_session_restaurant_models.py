# -*- coding: utf-8 -*-
# Copyright 2015-2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017,2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import fields, models


class RestaurantFloor(models.Model):
    _inherit = "restaurant.floor"

    pos_multi_session_ids = fields.Many2many(
        "pos.multi_session",
        "pos_multi_session_floor_rel",
        "floor_id",
        "pos_multi_session_id",
    )


class PosMultiSession(models.Model):
    _inherit = "pos.multi_session"

    floor_ids = fields.Many2many(
        "restaurant.floor",
        "pos_multi_session_floor_rel",
        "pos_multi_session_id",
        "floor_id",
        string="Restaurant Floors",
        help="The restaurant floors served by this point of sale",
        ondelete="restrict",
    )
    table_blocking = fields.Boolean("One Waiter per Table")


class PosConfig(models.Model):
    _inherit = "pos.config"

    ms_floor_ids = fields.Many2many(related="multi_session_id.floor_ids")
    table_blocking = fields.Boolean(related="multi_session_id.table_blocking")
