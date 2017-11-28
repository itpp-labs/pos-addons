from __future__ import absolute_import, unicode_literals
from odoo import fields, models


class AccountJournal(models.Model):
    _inherit = "account.journal"

    wechat_payment = fields.Boolean(string='Allow WeChat payments', default=False,
                                    help="Check this box if this account allows pay via WeChat")


class PosOrder(models.Model):
    _inherit = "pos.order"

    auth_code = fields.Integer(string='Code obtained from customers QR or BarCode', default=0)
