# -*- coding: utf-8 -*-
from odoo import fields, models


class ProductTemplate(models.Model):
    _inherit = "product.template"
    pos_notes = fields.Text("Notes for POS", translate=True)


class PosProductNotes(models.Model):
    _name = "pos.product_notes"

    def _default_sequence(self):
        numbers = self.env["pos.product_notes"].search([])
        sequences = []
        for r in numbers:
            sequences.append(r.number)
        if sequences:
            return max(sequences) + 1
        return 0

    number = fields.Integer(string="Sequence", default=_default_sequence)
    name = fields.Char(string="Note")
