# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import werkzeug.urls

from odoo import models, api


_logger = logging.getLogger(__name__)

try:
    from alipay import AlipayPay
except ImportError as err:
    _logger.debug(err)


class Param(models.Model):

    _inherit = 'ir.config_parameter'

    @api.model
    def get_alipay_pay_object(self):
        sandbox = self.get_param('alipay.sandbox', '0') != '0'
        if sandbox:
            _logger.info('Sandbox Mode is used for Alipay API')

        _logger.debug(
            'Alipay Credentials: app_id=%s, app_secret=%s, mch_id=%s, sub_mch_id=%s, sandbox mode is %s, cert=%s, key=%s',
            self.get_param('alipay.app_id', ''),
            '%s...' % self.get_param('alipay.app_secret', '')[:5],
            self.get_param('alipay.mch_id', ''),
            self.get_param('alipay.sub_mch_id', ''),
            sandbox,
            self.get_param('alipay.mch_cert', ''),
            self.get_param('alipay.mch_key', ''),
        )
        return AlipayPay(
            self.get_param('alipay.app_id', ''),
            self.get_param('alipay.app_secret', ''),
            self.get_param('alipay.mch_id', ''),
            sub_mch_id=self.get_param('alipay.sub_mch_id', ''),
            sandbox=sandbox,
            mch_cert=self.get_param('alipay.mch_cert', ''),
            mch_key=self.get_param('alipay.mch_key', ''),
            # TODO addd timeout?
        )

    @api.model
    def get_alipay_miniprogram_pay_object(self):
        sandbox = self.get_param('alipay.sandbox', '0') != '0'
        if sandbox:
            _logger.info('Sandbox Mode is used for Alipay API')
        _logger.debug('Alipay Credentials: miniprogram_app_id=%s, miniprogram_app_secret=%s, mch_id=%s, sub_mch_id=%s, sandbox mode is %s',
                      self.get_param('alipay.miniprogram_app_id', ''),
                      '%s...' % self.get_param('alipay.miniprogram_app_secret', '')[:5],
                      self.get_param('alipay.mch_id', ''),
                      self.get_param('alipay.sub_mch_id', ''),
                      sandbox
                      )
        return AlipayPay(
            self.get_param('alipay.miniprogram_app_id', ''),
            self.get_param('alipay.miniprogram_app_secret', ''),
            self.get_param('alipay.mch_id', ''),
            sub_mch_id=self.get_param('alipay.sub_mch_id', ''),
            sandbox=sandbox,
        )

    def get_openid_url(self, code):
        base_url = 'https://api.weixin.qq.com/sns/jscode2session'
        param = {
            'appid': self.get_param('alipay.miniprogram_app_id', ''),
            'secret': self.get_param('alipay.miniprogram_app_secret', ''),
            'js_code': code,
            'grant_type': 'authorization_code'
        }
        url = '%s?%s' % (base_url, werkzeug.urls.url_encode(param))
        _logger.debug('openid url: %s', url)
        return url
