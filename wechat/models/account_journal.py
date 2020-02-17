# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import fields, models


class Journal(models.Model):
    _inherit = "account.journal"

    wechat = fields.Selection(
        [("micropay", "Scanning customer's QR"), ("native", "Showing QR to customer")],
        string="WeChat Payment",
        help="Register for WeChat payment",
    )
