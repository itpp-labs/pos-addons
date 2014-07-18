# -*- coding: utf-8 -*-
from openerp.osv import osv,fields
from openerp import SUPERUSER_ID, api

class product_product(osv.Model):
    _inherit = 'product.product'

    @api.onchange('ean_sequence_id')
    def _onchange_ean_sequence_id(self):
        seq_ean13_to_weight = self.env.ref('product_barcode_generator_custom.seq_ean13_to_weight')
        seq_ean13_internal = self.env.ref('product_barcode_generator_custom.seq_ean13_internal')
        print 'onchange_to_weight', self.ean_sequence_id, seq_ean13_to_weight.id, seq_ean13_internal.id
        if self.ean_sequence_id.id == seq_ean13_to_weight.id:
            self.to_weight = True
        elif self.ean_sequence_id.id == seq_ean13_internal.id:
            self.to_weight = False
