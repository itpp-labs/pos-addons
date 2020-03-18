# -*- coding: utf-8 -*-
from odoo import models


class ProductProduct(models.Model):
    _inherit = "product.product"

    def split_lot_from_ui(self, records):
        res = []
        for r in records:
            product_id = r["product"]["id"]
            qty = r["qty"]
            self.env["product.product"].search([("id", "=", product_id)])._split_lot(
                qty
            )
            res.append(product_id)
        return res
