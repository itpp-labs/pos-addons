
from odoo import fields, models


class PosCategoryMulti(models.Model):
    _inherit = 'product.template'

    pos_category_ids = fields.Many2many('pos.category', string='Point of Sale Categories', help='Those categories are used to group similar products for point of sale.')
