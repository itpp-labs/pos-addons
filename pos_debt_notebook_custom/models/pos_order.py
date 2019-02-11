# Copyright 2019 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
from odoo import models, fields


class PosOrder(models.Model):
    _inherit = 'pos.order'

    def update_has_must_have_product(self):
        ids = self.env.context['active_ids']
        for order in self.browse(ids):
            if order.partner_id.has_must_have_product_order_id:
                continue
            if not any((line.product_id.is_must_have_product
                        for line in order.lines)):
                # no must have products purchased
                continue
            order.partner_id.has_must_have_product_order_id = order
