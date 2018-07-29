# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import json

from odoo import models, fields, api
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)

try:
    from wechatpy.exceptions import WeChatPayException
except ImportError as err:
    _logger.debug(err)


PAYMENT_RESULT_NOTIFICATION_URL = 'wechat/callback'
SUCCESS = 'SUCCESS'


class WeChatOrder(models.Model):
    _inherit = 'wechat.order'

    @api.model
    def create_jsapi_order(self, lines, create_vals):
        return self._create_jsapi_order(lines, create_vals)

    @api.model
    def _create_jsapi_order(self, lines, create_vals):
        """JSAPI Payment

        :param openid:        The WeChat user's unique ID
        :param lines:         list of dictionary
        :param create_vals:   User order information
        :returns order_id:    Current order id
                 result_json: Payments data for WeChat
        """
        debug = self.env['ir.config_parameter'].sudo().get_param('wechat.local_sandbox') == '1'

        vals = {
            'trade_type': 'NATIVE',
            'line_ids': [(0, 0, data) for data in lines],
            'debug': debug,
        }

        if create_vals:
            vals.update(create_vals)

        order = self.sudo().create(vals)
        total_fee = order._total_fee()
        body, detail = order._body()
        mpay = self.env['ir.config_parameter'].get_wechat_miniprogram_pay_object()
        openid = self.env.user.openid
        if debug:
            _logger.info('SANDBOX is activated. Request to wechat servers is not sending')
            # Dummy Data. Change it to try different scenarios
            result_raw = {
                'return_code': 'SUCCESS',
                'result_code': 'SUCCESS',
                'openid': '123',
                'timeStamp': '1414561699',
                'nonceStr': '5K8264ILTKCH16CQ2502SI8ZNMTM67VS',
                'package': 'prepay_id=123456789',
                'signType': 'MD5',
                'prepay_id': '123',
                'paySign': 'C380BEC2BFD727A4B6845133519F3AD6',
            }
            if self.env.context.get('debug_wechat_order_response'):
                result_raw = self.env.context.get('debug_wechat_order_response')
        else:
            _logger.debug('Unified order:\n total_fee: %s\n body: %s\n, detail: \n %s',
                          total_fee, body, detail)
            result_raw = mpay.order.create(
                trade_type='JSAPI',
                body=body,
                total_fee=total_fee,
                notify_url=self._notify_url(),
                out_trade_no=order.name,
                detail=detail,
                # TODO fee_type=record.currency_id.name
                sub_user_id=openid
            )
            _logger.debug('JSAPI Order result_raw: %s', result_raw)

        result_json = mpay.jsapi.get_jsapi_params(
            prepay_id=result_raw.get('prepay_id'),
            nonce_str=result_raw.get('nonce_str')
        )

        vals = {
            'result_raw': json.dumps(result_raw),
            'total_fee': total_fee,
        }
        order.sudo().write(vals)
        return {
            "order_id": order.id,
            "data": result_json
        }
