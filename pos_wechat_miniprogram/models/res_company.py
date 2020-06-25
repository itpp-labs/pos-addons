# Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import fields, models


class Company(models.Model):
    _inherit = "res.company"

    multi_session_ids = fields.One2many(
        "pos.multi_session", "company_id", string="Multi-Sessions"
    )
