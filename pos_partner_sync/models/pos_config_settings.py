# -*- coding: utf-8 -*-
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl-3.0.html).
from odoo import api, fields, models


class PosConfiguration(models.TransientModel):
    _inherit = "pos.config.settings"

    sync_field_ids = fields.Many2many(
        "ir.model.fields",
        string="Synchronized Fields",
        domain=[("model", "=", "res.partner")],
    )

    @api.multi
    def set_sync_field_ids(self):
        self.env["ir.config_parameter"].set_param(
            "pos_partner_sync.sync_field_ids",
            ", ".join(str(x) for x in self.sync_field_ids.ids),
        )

    @api.multi
    def get_default_sync_field_ids(self, fields):
        sync_field_ids = self.env["ir.config_parameter"].get_param(
            "pos_partner_sync.sync_field_ids", default=False
        )
        return {
            "sync_field_ids": sync_field_ids
            and [int(x) for x in sync_field_ids.split(",")]
        }
