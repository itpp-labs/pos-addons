# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import _, api, models
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class ReportTableQrCode(models.AbstractModel):
    """Abstract Model for report template.
    for `_name` model, please use `report.` as prefix then add `module_name.report_name`.
    """

    _name = "report.pos_wechat_miniprogram.report_generate_qr_code"

    @api.model
    def get_report_values(self, docids, data=None):
        access_token = (
            self.env["ir.config_parameter"].sudo().get_miniprogram_access_token()
        )
        _logger.debug("access_token: %s", access_token)
        if not access_token:
            raise UserError(_("Failed to get access token"))
        form = data.get("form")
        records = self.env["restaurant.table"].browse(form.get("table_ids"))
        docs = [
            {"name": r.name, "qr_code": r.get_miniprogram_qr_code(access_token)}
            for r in records
        ]

        return {
            "doc_ids": data["ids"],
            "doc_model": data["model"],
            "quantity": int(form.get("quantity")),
            "floor": form.get("name"),
            "docs": docs,
        }
