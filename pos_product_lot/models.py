# -*- coding: utf-8 -*-



class ProductProduct(orm.Model):
    _inherit = 'product.product'

    def split_lot_from_ui(self, cr, uid, records, context=None):
        res = []
        for r in records:
            self._split_lot(cr, uid,
                            r['product']['id'], r['qty'],
                            context=context)
            res.append(r['id'])
        return res
