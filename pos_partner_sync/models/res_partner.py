# -*- coding: utf-8 -*-
# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl-3.0.html).
from odoo import api, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    def check_fields_to_send(self, vals):
        fields = (
            self.env["ir.config_parameter"]
            .sudo()
            .get_param("pos_partner_sync.sync_field_ids", default=False)
        )
        if not fields:
            return False
        field_names = (
            self.env["ir.model.fields"]
            .browse([int(x) for x in fields.split(",")])
            .mapped("name")
        )
        for name in field_names:
            if name in vals:
                return True
        return False

    @api.multi
    def write(self, vals):
        result = super(ResPartner, self).write(vals)
        if self.check_fields_to_send(vals):
            self.send_field_updates(self.ids)
        return result

    @api.model
    def create(self, vals):
        partner = super(ResPartner, self).create(vals)
        if self.check_fields_to_send(vals):
            self.send_field_updates([partner.id])
        return partner

    @api.multi
    def unlink(self):
        res = super(ResPartner, self).unlink()
        self.send_field_updates(self.ids, action="unlink")
        return res

    @api.model
    def send_field_updates(self, partner_ids, action=""):
        channel_name = "pos_partner_sync"
        data = {
            "message": "update_partner_fields",
            "action": action,
            "partner_ids": partner_ids,
        }
        self.env["pos.config"].send_to_all_poses(channel_name, data)
