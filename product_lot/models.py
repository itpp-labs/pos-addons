# -*- coding: utf-8 -*-
from openerp import fields


class ProductProduct(orm.Model):
    _inherit = 'product.product'

    def _get_lot_id(self, cr, uid, ids, name, arg, context=None):
        res = {}
        for id in ids:
            lot_id = self.search(cr, uid, [('lot_product_id', '=', id)])
            res[id] = lot_id and lot_id[0] or None
        return res


        # lot product fields
    is_lot = fields.Boolean('Lot of products')
    lot_qty = fields.Integer('Quantity products in Lot')
    lot_product_id = fields.Many2one('product.product', 'Product in lot')  # In fact is one2one

        # normal product fields
    lot_id = fields.Many2one(compute="_get_lot_id", relation='product.product', string='Used in Lot')

    _defaults = {
        'is_lot': False
    }

    def button_split_lot(self, cr, uid, ids, context=None):
        return self._split_lot(cr, uid, ids[0], context=context)

    def _split_lot(self, cr, uid, lot_id, qty=1.0, context=None):
        lot = self.browse(cr, uid, lot_id, context=context)
        assert lot.is_lot, "You can split only lot product"
        assert lot.lot_product_id, "Product in lot is not specified"
        assert lot.lot_qty > 0, "Check quantity roducts in lot"
        stock_move_obj = self.pool.get('stock.move')

        source_location_id = context and context.get('location')
        if not source_location_id:
            source_location_id = self.pool.get('ir.model.data').get_object_reference(cr, uid, 'stock', 'stock_location_stock')[1]
        destination_location_id = source_location_id
        middle_location_id = lot.property_stock_production.id

        cons_move_id = stock_move_obj.create(cr, uid, {
            'name': 'split product (consume)',
            'product_id': lot.id,
            'product_uom_qty': qty,
            'product_uom': lot.uom_id.id,
            'location_id': source_location_id,
            'location_dest_id': middle_location_id,
            'company_id': lot.company_id.id,
        }, context=context)

        prod_move_id = stock_move_obj.create(cr, uid, {
            'name': 'split product (produce)',
            'product_id': lot.lot_product_id.id,
            'product_uom_qty': qty * lot.lot_qty,
            'product_uom': lot.lot_product_id.uom_id.id,
            'location_id': middle_location_id,
            'location_dest_id': destination_location_id,
            'company_id': lot.lot_product_id.company_id.id,
        }, context=context)
        stock_move_obj.action_done(cr, uid, [cons_move_id, prod_move_id], context=context)
        return True
