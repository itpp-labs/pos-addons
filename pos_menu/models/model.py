# -*- coding: utf-8 -*-
from odoo import fields, models


class ProductTemplate(models.Model):
    _inherit = "product.template"

    tag_ids = fields.Many2many(
        "pos.tag",
        "tag_ids_product_ids_rel",
        "product_id",
        "tag_id",
        string="Product Sets",
    )


class PosConfig(models.Model):
    _inherit = "pos.config"

    tag_ids = fields.Many2many(
        "pos.tag",
        "tag_ids_pos_ids_rel",
        "pos_id",
        "tag_id",
        string="Available Product Sets",
    )
    current_session_state = fields.Char(search="_search_current_session_state")

    def _search_current_session_state(self, operator, value):
        ids = map(lambda x: x.id, self.env["pos.config"].search([]))
        value_ids = map(
            lambda x: x.config_id.id,
            self.env["pos.session"].search([("state", "=", value)]),
        )
        value_ids = list(set(value_ids))
        if operator == "=":
            return [("id", "in", value_ids)]
        elif operator == "!=":
            ids = [item for item in ids if item not in value_ids]
            return [("id", "in", ids)]
        else:
            return [("id", "in", [])]


class PosTag(models.Model):
    _name = "pos.tag"

    name = fields.Char(string="Name")
    product_ids = fields.Many2many(
        "product.template",
        "tag_ids_product_ids_rel",
        "tag_id",
        "product_id",
        domain="[('available_in_pos', '=', True)]",
        string="Products",
    )
    pos_ids = fields.Many2many(
        "pos.config", "tag_ids_pos_ids_rel", "tag_id", "pos_id", string="POSes"
    )
