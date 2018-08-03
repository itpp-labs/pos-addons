# -*- coding: utf-8 -*-
# Copyright (c) 2004-2015 Odoo S.A.
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl-3.0.html).
from odoo import models, api


class ResPartner(models.Model):
    _inherit = 'res.partner'

    @api.multi
    def write(self, vals):
        result = super(ResPartner, self).write(vals)
        if vals.get('barcode'):
            self.send_barcode_updates(self.ids)
        return result

    @api.model
    def create(self, vals):
        partner = super(ResPartner, self).create(vals)
        if vals.get('barcode'):
            self.send_barcode_updates([partner.id])
        return partner

    @api.model
    def send_barcode_updates(self, partner_ids):
        channel_name = "pos_barcode_sync"
        data = {'message': 'update_partner_barcode', 'partner_ids': partner_ids}
        self.env['pos.config'].send_to_all_poses(channel_name, data)
