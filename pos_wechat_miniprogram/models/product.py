# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import fields, models


class ProductTemplate(models.Model):
    _inherit = "product.template"

    hot_product = fields.Boolean(
        string="Hot Product",
        help="Check if you this product is hot product (promotion)",
        default=False,
    )
    banner = fields.Binary(string="Hot product banner", attachment=True)
    available_pos_product_qty = fields.Integer(string="Available Products", default=1,)
