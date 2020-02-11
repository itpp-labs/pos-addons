# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging

from odoo import api, models

_logger = logging.getLogger(__name__)

try:
    from wechatpy import WeChatPay
except ImportError as err:
    _logger.debug(err)


class Param(models.Model):

    _inherit = "ir.config_parameter"

    @api.model
    def get_wechat_pay_object(self):
        sandbox = self.get_param("wechat.sandbox", "0") != "0"
        if sandbox:
            _logger.info("Sandbox Mode is used for WeChat API")

        _logger.debug(
            "WeChat Credentials: app_id=%s, app_secret=%s, mch_id=%s, sub_mch_id=%s, sandbox mode is %s, cert=%s, key=%s",
            self.get_param("wechat.app_id", ""),
            "%s..." % self.get_param("wechat.app_secret", "")[:5],
            self.get_param("wechat.mch_id", ""),
            self.get_param("wechat.sub_mch_id", ""),
            sandbox,
            self.get_param("wechat.mch_cert", ""),
            self.get_param("wechat.mch_key", ""),
        )
        return WeChatPay(
            self.get_param("wechat.app_id", ""),
            self.get_param("wechat.app_secret", ""),
            self.get_param("wechat.mch_id", ""),
            sub_mch_id=self.get_param("wechat.sub_mch_id", ""),
            sandbox=sandbox,
            mch_cert=self.get_param("wechat.mch_cert", ""),
            mch_key=self.get_param("wechat.mch_key", ""),
            # TODO addd timeout?
        )
