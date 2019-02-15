# -*- coding: utf-8 -*-
# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl-3.0.html).
from odoo import models, api, fields


class ResPartner(models.Model):
    _inherit = 'res.partner'

    @api.multi
    def write(self, vals):
        result = super(ResPartner, self).write(vals)
        fields = self.env["ir.config_parameter"].sudo().get_param("pos_barcode_sync.sync_field_ids", default=False)
        if not fields:
            return result
        field_names = self.env['ir.model.fields'].browse([int(x) for x in fields.split(',')]).mapped('name')
        updated_fields = []
        for name in field_names:
            if vals.get(name):
                updated_fields.append(name)
        if len(updated_fields):
            self.send_field_updates(self.ids)
        return result

    @api.model
    def create(self, vals):
        partner = super(ResPartner, self).create(vals)
        if vals.get('barcode'):
            self.send_barcode_updates([partner.id])
        return partner

    @api.model
    def send_field_updates(self, partner_ids):
        channel_name = "pos_barcode_sync"
        data = {'message': 'update_partner_fields', 'partner_ids': partner_ids}
        self.env['pos.config'].send_to_all_poses(channel_name, data)
