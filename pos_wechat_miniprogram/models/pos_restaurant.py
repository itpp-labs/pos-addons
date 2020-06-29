# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import werkzeug.urls

from odoo import api, fields, models


class RestaurantTable(models.Model):
    _inherit = "restaurant.table"

    wechat_miniprogram_qr = fields.Binary(
        string="WeChat mini-program QR", attachment=True
    )

    @api.multi
    def get_miniprogram_qr_code(self, access_token=False):
        self.ensure_one()
        if self.wechat_miniprogram_qr:
            return self.wechat_miniprogram_qr

        param = {
            "company_id": self.env.user.company_id.id,
            "floor_id": self.floor_id.id,
            "table_id": self.id,
        }
        data = {
            "path": "{}?{}".format(
                "pages/index/index", werkzeug.urls.url_encode(param)
            ),
            "width": 430,
        }
        qr = self.env["ir.config_parameter"].sudo().get_qr_code(data, access_token)
        self.write({"wechat_miniprogram_qr": qr})
        return qr
