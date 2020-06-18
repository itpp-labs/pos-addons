# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import fields, models


class Journal(models.Model):
    _inherit = "account.journal"

    alipay = fields.Selection(
        [("scan", "Scanning customer's QR"), ("show", "Showing QR to customer")],
        string="Alipay Payment",
        help="Register for Alipay payment",
    )
