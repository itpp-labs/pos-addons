# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import api, models


class PosOrder(models.Model):
    _inherit = "pos.order"

    @api.model
    def create_from_ui(self, orders):
        res = super(PosOrder, self).create_from_ui(orders)
        for o in orders:
            data = o.get("data")
            miniprogram_data = data.get("miniprogram_order") or {}
            submitted_references = data.get("name")
            order = self.search([("pos_reference", "=", submitted_references)])
            if order and miniprogram_data.get("id"):
                miniprogram_order = self.env["pos.miniprogram.order"].browse(
                    int(miniprogram_data.get("id"))
                )
                if miniprogram_order:
                    miniprogram_order.write(
                        {
                            "state": "done",
                            "order_id": order.id,
                            "confirmed_from_pos": True,
                            "order_ref": data.get("miniprogram_order_ref"),
                        }
                    )
        return res
