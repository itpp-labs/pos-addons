# -*- coding: utf-8 -*-
from odoo import fields, models


class ProductProduct(models.Model):
    _inherit = "product.product"

    # lot product fields
    is_lot = fields.Boolean(string="Lot of products", default=False)
    lot_qty = fields.Integer(string="Quantity products in Lot")
    lot_product_id = fields.Many2one(
        "product.product", "Product in lot"
    )  # In fact is one2one
    # normal product fields
    lot_id = fields.Many2one(
        "product.product", compute="_compute_get_lot_id", string="Used in Lot"
    )

    def _compute_get_lot_id(self):
        for i in self:
            i.lot_id = self.env["product.product"].search(
                [("lot_product_id", "=", i.id)]
            )

    def button_split_lot(self):
        return self._split_lot()

    def _split_lot(self, qty=1.0):
        lot = self
        assert lot.is_lot, "You can split only lot product"
        assert lot.lot_product_id, "Product in lot is not specified"
        assert lot.lot_qty > 0, "Check quantity products in lot"
        stock_move_obj = self.env["stock.move"]
        source_location_id = self._context and self._context.get("location")
        if not source_location_id:
            source_location_id = self.env["ir.model.data"].get_object_reference(
                "stock", "stock_location_stock"
            )[1]
        destination_location_id = source_location_id
        middle_location_id = lot.property_stock_production.id

        cons_move_id = stock_move_obj.create(
            {
                "name": "split product (consume)",
                "product_id": lot.id,
                "product_uom_qty": qty,
                "product_uom": lot.uom_id.id,
                "location_id": source_location_id,
                "location_dest_id": middle_location_id,
                "company_id": lot.company_id.id,
            }
        )

        prod_move_id = stock_move_obj.create(
            {
                "name": "split product (produce)",
                "product_id": lot.lot_product_id.id,
                "product_uom_qty": qty * lot.lot_qty,
                "product_uom": lot.lot_product_id.uom_id.id,
                "location_id": middle_location_id,
                "location_dest_id": destination_location_id,
                "company_id": lot.lot_product_id.company_id.id,
            }
        )
        cons_move_id.action_done()
        prod_move_id.action_done()
        return True
