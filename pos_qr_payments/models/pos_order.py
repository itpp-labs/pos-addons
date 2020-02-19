# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).
import re

from odoo import api, fields, models


class PosOrder(models.Model):
    _inherit = "pos.order"

    pos_reference_uid = fields.Char(
        string="Order UID", compute="_compute_pos_reference_uid"
    )

    @api.depends("pos_reference")
    def _compute_pos_reference_uid(self):
        for r in self:
            reference = r.pos_reference and re.search(
                r"\d{1,}-\d{1,}-\d{1,}", r.pos_reference
            )
            r.pos_reference_uid = reference and reference.group(0) or ""
