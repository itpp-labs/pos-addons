# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
from odoo import api, fields, models


class PosMakePayment(models.TransientModel):
    _inherit = "pos.make.payment"

    order_ref = fields.Char(compute="_compute_order_ref")

    # TODO: It could be removed, as we set defaul values and don't need to use domain

    # It doesn't depend on journal_id, it's a workaround, because otherwise it
    # doesn't receive a value in form
    @api.depends("journal_id")
    def _compute_order_ref(self):
        order = self.env["pos.order"].browse(self.env.context.get("active_id", False))
        if order:
            for r in self:
                r.order_ref = order.pos_reference_uid
