from odoo import models, fields


class PosConfig(models.Model):
    _inherit = 'pos.config'

    allow_sell_coupon = fields.Boolean(string="Allow Sell Coupon", default=True)
    allow_consume_coupon = fields.Boolean(string="Allow Consume Coupon", default=True)
