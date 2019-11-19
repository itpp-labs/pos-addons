# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    show_qtys = fields.Boolean("Show Product Qtys", help="Show Product Qtys in POS", default=True)
