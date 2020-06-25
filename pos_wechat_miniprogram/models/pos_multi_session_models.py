# Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import fields, models


class PosMultiSession(models.Model):
    _inherit = "pos.multi_session"

    allow_instant_payment = fields.Boolean(
        string="Allow Instant Payment",
        default=True,
        help="Instant Payment of the order from WeChat Mini-Program",
    )
    allow_deffered_payment = fields.Boolean(
        string="Allow Deffered Payment",
        default=True,
        help="Deffered Payment of the order from WeChat Mini-Program",
    )
