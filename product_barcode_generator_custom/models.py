# -*- coding: utf-8 -*-
from openerp.osv import osv,fields
from openerp import SUPERUSER_ID

class product_product(osv.Model):
    _inherit = 'product.product'

    def generate_ean13(self, cr, uid, ids, context=None):
        if context is None: context = {}
        generate_context = context.copy()

        product_ids = self.browse(cr, uid, ids, context=context)

        seq_ean13_to_weight = product_ids.env.ref('product_barcode_generator_custom.seq_ean13_to_weight')
        seq_ean13_internal = product_ids.env.ref('product_barcode_generator_custom.seq_ean13_internal')

        for product in product_ids:
            if product.barcode:
                continue
            if product.to_weight:
                sequence_id = seq_ean13_to_weight.id
            else:
                sequence_id = seq_ean13_internal.id
            generate_context.update({'sequence_id':sequence_id})
            ean13 = self._generate_ean13_value(cr, uid, product, context=generate_context)
            if not ean13:
                continue
            self.write(cr, uid, [product.id], {
                'ean_sequence_id':sequence_id,
                'barcode': ean13,
            }, context=context)
        return True
