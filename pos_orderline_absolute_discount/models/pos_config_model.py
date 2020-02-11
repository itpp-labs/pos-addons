from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    include_discount_in_prices = fields.Boolean(
        string="Include Discount in Prices",
        help="If box is unchecked the displayed prices will not include discounts",
    )
