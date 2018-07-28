# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
from odoo import models, api
from ..controllers.alipay_controllers import ALIPAY_NOTIFY_URL


_logger = logging.getLogger(__name__)
try:
    from alipay import AliPay, ISVAliPay
except ImportError as err:
    _logger.debug(err)


class Param(models.Model):

    _inherit = 'ir.config_parameter'

    @api.model
    def get_alipay_object(self):
        sandbox = self.sudo().get_param('alipay.sandbox', '0') != '0'
        if sandbox:
            _logger.info('Sandbox Mode is used for Alipay API')

        app_id = self.sudo().get_param('alipay.app_id', '')
        app_auth_code = self.sudo().get_param('alipay.app_auth_code', '')
        app_secret = self.sudo().get_param('alipay.app_secret', '')

        app_private_key = self.sudo().get_param('alipay.app_private_key', '')
        app_public_key = self.sudo().get_param('alipay.app_public_key', '')
        alipay_public_key_string = self.sudo().get_param('alipay.alipay_public_key_string', '')

        notify_url = self.sudo().get_param('alipay.notify_url')
        if not notify_url:
            base = self.sudo().get_param('web.base.url')
            notify_url = "{base}{path}".format(
                base=base,
                path=ALIPAY_NOTIFY_URL,
            )

        _logger.debug(
            'Alipay Credentials: app_id=%s, app_auth_code=%s, app_secret=%s, app_private_key=%s, app_public_key=%s, alipay_public_key_string=%s, ',
            app_id,
            '%s...' % app_auth_code[:5],
            '%s...' % app_secret[:5],
            app_private_key,
            app_public_key,
            alipay_public_key_string,
        )
        options = dict(
            app_id=app_id,
            app_secret=app_secret,

            app_private_key=app_private_key,
            app_public_key=app_public_key,
            alipay_public_key_string=alipay_public_key_string,

            app_notify_url=notify_url,
            sign_type="RSA",
            debug=sandbox,
        )
        if app_auth_code:
            # ISV
            options['app_auth_code'] = app_auth_code
            return ISVAliPay(**options)
        else:
            return AliPay(**options)
