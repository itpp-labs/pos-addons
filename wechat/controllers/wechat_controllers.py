# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
from odoo import http
from odoo.http import request
import json
import requests

_logger = logging.getLogger(__name__)


class WechatController(http.Controller):

    @http.route('/wechat/callback', methods=['POST'], auth='user', type='json')
    def micropay(self, **kwargs):
        _logger.debug('/wechat/callback request data: %s', kwargs)
        res = request.env['wechat.order'].on_notification(kwargs)
        if res:
            return {"return_code": "SUCCESS"}
        else:
            return {"return_code": "FAIL"}

    @http.route('/wechat/miniprogram/openid', methods=['POST'], auth='user', type='json')
    def openid(self, code, **kwargs):
        """Get openid

        :param code: After the user is permitted to log in on the WeChat mini-program, the callback content will
        bring the code (five-minute validity period). The developer needs to send the code to the backend
        of their server and use code in exchange for the session_key api.
        The code is exchanged for the openid and session_key.
        :return openid: The WeChat user's unique ID
        """
        url = request.env['ir.config_parameter'].get_openid_url(code)
        openid = requests.get(url)
        # TODO: create partner by openid
        return openid

    @http.route('/wechat/miniprogram/payment', methods=['POST'], auth='user', type='http', csrf=False)
    def payment(self, **kwargs):

        """Create and Payment a Order

        :param data['openid']:      The WeChat user's unique ID, data - User order information
        :param data['lines']:       Order lines
        :param data['create_vals']: info about the user order
        :returns order:             Current order id
                 data['timeStamp']: Time stamp for the number of seconds from 00:00:00 on January 1, 1970 to the present, that is, the current time
                 data['nonceStr']:  A random string of 32 characters or less.
                 data['package']:   Unifies prepay_id parameter values returned by the order interface, submitted format such as: prepay_id=*
                 data['signType']:  Signature algorithm, temporarily supports MD5
                 data['paySign']:   Signature, refer to the WeChat Official Account Payment Help Document (https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=4_3) for the specific signature scheme
        """
        openid = json.loads(kwargs.get('openid'))
        lines = json.loads(kwargs.get('lines'))
        create_vals = json.loads(kwargs.get('create_vals'))
        order, data = request.env['wechat.order'].create_jsapi_order(openid, lines, create_vals)
        res = {
            "order_id": order.id,
            "data": data
        }
        return json.dumps(res)
