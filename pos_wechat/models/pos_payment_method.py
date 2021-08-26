from odoo import fields, models


class PosPaymentMethod(models.Model):
    _inherit = "pos.payment.method"

    wechat_enabled = fields.Boolean("Is WeChat enabled?")
    wechat_journal_id = fields.Many2one(
        "account.journal", "WeChat Journal", domain="[('wechat', '!=', False)]"
    )
    wechat_method = fields.Selection(related="wechat_journal_id.wechat")
