# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import api, fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    use_only_qr_scan = fields.Boolean('Only QR scanning')
    use_only_barcode_scan = fields.Boolean('Only Barcode scanning')

    @api.onchange('use_only_qr_scan')
    def _onchange_use_only_qr_scan(self):
        if self.use_only_qr_scan:
            self.use_only_barcode_scan = False

    @api.onchange('use_only_barcode_scan')
    def _onchange_use_only_barcode_scan(self):
        if self.use_only_barcode_scan:
            self.use_only_qr_scan = False
