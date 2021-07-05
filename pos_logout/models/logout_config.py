# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    logout_interval = fields.Integer(
        string="Screen Auto-lock",
        default=0,
        help="The last activity interval to activate the automatic screen lock. Zero if autolocking is not needed",
    )
