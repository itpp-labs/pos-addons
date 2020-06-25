# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import api, fields, models

_logger = logging.getLogger(__name__)


class PosTableQrCode(models.TransientModel):
    _name = "pos.table.qrcode.wizard"
    _description = "Open QR code window of tables"

    floor_id = fields.Many2one("restaurant.floor", "Floor", required=True)
    table_ids = fields.Many2many(
        "restaurant.table", string="Tables", domain="[('floor_id', '=', floor_id)]"
    )
    quantity = fields.Integer(
        string="Quantity", help="The quantity of QR Code for each table", default=1
    )

    @api.onchange("floor_id")
    def _on_change_floor(self):
        if self.floor_id:
            self.table_ids = self.env["restaurant.table"].search(
                [("floor_id", "=", self.floor_id.id)]
            )
        else:
            self.table_ids = None

    @api.multi
    def generate_qrcode(self):
        """
        Call when button 'Get QR Code' clicked.
        """
        data = {
            "ids": self.ids,
            "model": self._name,
            "form": {
                "name": self.floor_id.name,
                "table_ids": [table.id for table in self.table_ids],
                "quantity": self.quantity,
            },
        }
        # use `module_name.report_id` as reference.
        # `report_action()` will call `get_report_values()` and pass `data` automatically.
        return self.env.ref(
            "pos_wechat_miniprogram.generate_qr_code_report"
        ).report_action(self, data=data)
