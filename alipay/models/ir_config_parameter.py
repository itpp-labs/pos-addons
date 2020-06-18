# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import api, models

from ..controllers.alipay_controllers import ALIPAY_NOTIFY_URL

_logger = logging.getLogger(__name__)
try:
    from alipay import AliPay, ISVAliPay
except ImportError as err:
    _logger.debug(err)


class Param(models.Model):

    _inherit = "ir.config_parameter"

    @api.model
    def get_alipay_object(self):
        sandbox = self.sudo().get_param("alipay.sandbox", "0") != "0"
        if sandbox:
            _logger.info("Sandbox Mode is used for Alipay API")

        app_id = self.sudo().get_param("alipay.app_id", "")
        app_auth_code = self.sudo().get_param("alipay.app_auth_code", "")

        app_private_key_file = self.sudo().get_param("alipay.app_private_key_file", "")
        alipay_public_key_string = self.sudo().get_param(
            "alipay.alipay_public_key_string", DEFAULT_ALIPAY_PUBLIC_KEY
        )

        if self.env.context.get("app_private_key_string"):
            # It's used in tests
            app_private_key_string = self.env.context.get("app_private_key_string")
        else:
            with open(app_private_key_file, "r") as f:
                app_private_key_string = f.read()

        options = dict(
            appid=app_id,
            app_private_key_string=app_private_key_string,
            alipay_public_key_string=alipay_public_key_string,
            sign_type="RSA",
            debug=sandbox,
        )

        notify_url = self.sudo().get_param("alipay.notify_url")
        if not notify_url:
            base = self.sudo().get_param("web.base.url")
            notify_url = "{base}{path}".format(base=base, path=ALIPAY_NOTIFY_URL,)

        options["app_notify_url"] = notify_url

        if app_auth_code:
            # ISV
            options["app_auth_code"] = app_auth_code
            _logger.debug("ISV mode is used for Alipay", options)
            res = ISVAliPay(**options)
        else:
            res = AliPay(**options)
        _logger.debug("Alipay parameters: %s", options)
        return res


# FROM https://global.alipay.com/service/declaration/8
DEFAULT_ALIPAY_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDI6d306Q8fIfCOaTXyiUeJHkrIvYISRcc73s3vF1ZT7XN8RNPwJxo8pWaJMmvyTn9N4HQ632qJBVHf8sxHi/fEsraprwCtzvzQETrNRwVxLO5jVmRGi60j8Ue1efIlzPXV9je9mkjzOmdssymZkh2QhUrCmZYI/FCEa3/cNMW0QIDAQAB

-----END PUBLIC KEY-----"""
