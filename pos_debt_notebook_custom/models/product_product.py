# Copyright 2019 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
from odoo import models, fields, api


class Product(models.Model):
    _inherit = 'product.product'

    is_must_have_product = fields.Boolean(compute='_compute_is_must_have_product', store=True)
    must_have_product_journal_ids = fields.One2many('account.journal', 'must_have_product_id')

    @api.depends('must_have_product_journal_ids')
    def _compute_is_must_have_product(self):
        for p in self:
            p.is_must_have_product = len(p.must_have_product_journal_ids)
