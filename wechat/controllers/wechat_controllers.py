# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
from odoo import http
from odoo.http import request
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
    def openid(self, code):
        # code - After the user is permitted to log in on the WeChat mini-program, the callback content will
        # bring the code (five-minute validity period). The developer needs to send the code to the backend
        # of their server and use code in exchange for the session_key api.
        # The code is exchanged for the openid and session_key.
        url = self.env['ir.config_parameter'].get_openid_url(code)
        return requests.get(url)

    @http.route('/wechat/miniprogram/payment', methods=['POST'], auth='user', type='json')
    def openid(self, data):
        openid = data['openid']
        data = data['data']
        # openid - The WeChat user's unique ID
        # data - User order information
        return request.env['wechat.order'].create_jsapi_order(openid, data)
