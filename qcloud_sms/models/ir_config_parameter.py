# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import api, models

_logger = logging.getLogger(__name__)

try:
    from qcloudsms_py import QcloudSms
except ImportError as err:
    _logger.debug(err)


class Param(models.Model):

    _inherit = "ir.config_parameter"

    @api.model
    def get_qcloud_sms_object(self):
        _logger.debug(
            "Tencent Cloud SMS Credentials: app_id=%s, app_key=%s",
            self.get_param("qcloudsms.app_id", ""),
            "%s..." % self.get_param("qcloudsms.app_key", "")[:5],
        )
        return QcloudSms(
            self.get_param("qcloudsms.app_id", ""),
            self.get_param("qcloudsms.app_key", ""),
        )
