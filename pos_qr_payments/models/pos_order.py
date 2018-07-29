# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
from odoo import models, api, fields


class PosOrder(models.Model):
    _inherit = 'pos.order'

    pos_reference_uid = fields.Char(string='Order UID', compute='_compute_pos_reference_uid')

    @api.depends('pos_reference')
    def _compute_pos_reference_uid(self):
        for r in self:
            r.pos_reference_uid = (r.pos_reference or ' ').split(' ', 1)[1]
