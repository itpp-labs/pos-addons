# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import werkzeug.urls

from odoo import models, api


_logger = logging.getLogger(__name__)

try:
    from wechatpy import WeChatPay
except ImportError as err:
    _logger.debug(err)


class Param(models.Model):

    _inherit = 'ir.config_parameter'

    @api.model
    def get_wechat_miniprogram_pay_object(self):
        sandbox = self.sudo().get_param('wechat.sandbox', '0') != '0'
        if sandbox:
            _logger.info('Sandbox Mode is used for WeChat API')
        _logger.debug('WeChat Credentials: miniprogram_app_id=%s, miniprogram_app_secret=%s, mch_id=%s, sub_mch_id=%s, sandbox mode is %s',
                      self.sudo().get_param('wechat.miniprogram_app_id', ''),
                      '%s...' % self.sudo().get_param('wechat.miniprogram_app_secret', '')[:5],
                      self.sudo().get_param('wechat.mch_id', ''),
                      self.sudo().get_param('wechat.sub_mch_id', ''),
                      sandbox
                      )
        return WeChatPay(
            self.sudo().get_param('wechat.app_id', ''),
            self.sudo().get_param('wechat.app_secret', ''),
            self.sudo().get_param('wechat.mch_id', ''),
            sub_mch_id=self.sudo().get_param('wechat.sub_mch_id', ''),
            sandbox=sandbox,
            sub_appid=self.sudo().get_param('wechat.miniprogram_app_id', '')
        )

    def get_openid_url(self, code):
        base_url = 'https://api.weixin.qq.com/sns/jscode2session'
        param = {
            'appid': self.sudo().get_param('wechat.miniprogram_app_id', ''),
            'secret': self.sudo().get_param('wechat.miniprogram_app_secret', ''),
            'js_code': code,
            'grant_type': 'authorization_code'
        }
        url = '%s?%s' % (base_url, werkzeug.urls.url_encode(param))
        _logger.debug('openid url: %s', url)
        return url
