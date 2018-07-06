from __future__ import absolute_import, unicode_literals
import odoo
from odoo import http
from odoo.http import request
from wechatpy import parse_message, create_reply
from wechatpy.utils import check_signature
from wechatpy.exceptions import (
    InvalidSignatureException,
    InvalidAppIdException,
)


class WechatController(odoo.http.Controller):

    @http.route('/wechat/micropay', methods=['POST'], auth='user', type='json')
    def micropay(self, auth_code, terminal_ref):
        pass
