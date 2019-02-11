# Copyright 2019 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
from odoo import models, fields


class Journal(models.Model):
    _inherit = 'account.journal'

    must_have_product_id = fields.Many2one('product.product', string='Must-have Product')
