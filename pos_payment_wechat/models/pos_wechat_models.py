from __future__ import absolute_import, unicode_literals
from odoo import fields, models


class AccountJournal(models.Model):
    _inherit = "account.journal"

    wechat_payment = fields.Boolean(string='Allow WeChat payments', default=True,
                                    help="Check this box if this account allows pay via WeChat")
    smth_new_from_qr = fields.Boolean(string='Allow WeChat payments', default=False,
                                      help="Test field before I understand what should be here")
