# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import fields
from odoo import models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    logout_interval = fields.Integer(string='Screen Autolock', default=0, help="Interval after the last activity before screen is blocked. Zero if autolocking is not needed")
