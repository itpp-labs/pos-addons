# -*- coding: utf-8 -*-
from odoo import fields, models


class PosTag(models.Model):
    _inherit = "pos.tag"

    pos_multi_session_ids = fields.Many2many(
        "pos.multi_session",
        "pos_multi_session_tag_rel",
        "tag_id",
        "pos_multi_session_id",
        string="Multi Sessions",
    )


class PosMultiSession(models.Model):
    _inherit = "pos.multi_session"

    tag_ids = fields.Many2many(
        "pos.tag",
        "pos_multi_session_tag_rel",
        "pos_multi_session_id",
        "tag_id",
        string="Available Product Sets",
        ondelete="restrict",
    )


class PosConfig(models.Model):
    _inherit = "pos.config"

    tag_ids = fields.Many2many(related="multi_session_id.tag_ids")
