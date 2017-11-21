from __future__ import absolute_import, unicode_literals

import time
import math

from odoo.osv import expression
from odoo.tools.float_utils import float_round as round, float_is_zero as is_zero
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
from odoo.exceptions import UserError, ValidationError
from odoo import api, fields, models
import json, requests, time
import json, requests, time
# from wechatpy.utils import check_signature


class AccountJournal(models.Model):
    _inherit = "account.journal"

    wechat_payment = fields.Boolean(string='Allow WeChat payments', default=False,
                                    help="Check this box if this account allows pay via WeChat")
    smth_new_from_qr = fields.Boolean(string='Allow WeChat payments', default=False,
                                      help="Test field before I understand what should be here")


# class WechatServer(models.Model):
#     _name = "wechat.model"
#
#     appId = fields.Char(string='APPID', default='wxae8ec5c35915fe27')
#     appSecret = fields.Char(string='AppSecret', default='5cf76a750158b1e948d4680209c38ec4')
#     token = fields.Char(string='Token',
#                         default='dGzVrDgxeC08pj7bRkozjwVMgsaP-P4hZORRtMiuf-IgpysMI2X__zAK2nFVVtqJTP8q9aZhIYhglspwIAek00Op3r30Wyybl3T66fCW7MkCXEgAEAIDK')
#
#     def getAccessToken(self):
#         data = json.loads(open('access_token.json').read())
#         access_token = data['access_token']
#         if data['expire_time'] < time.time():
#             url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s" % (self.appId, self.appSecret)
#             response = requests.get(url)
#             access_token = json.loads(response.text)['access_token']
#             data['access_token'] = access_token
#             data['expire_time'] = int(time.time()) + 7000
#
#             fopen = open('access_token.json', 'w')
#             fopen.write(json.dumps(data))
#             fopen.close()
#         return access_token
#
#
# class WechatServer(models.AbstractModel):
#     _name = "wechat.server"
#
#     def check_signature(self, post):
#         APPID = self.env['wechat.model'].appId
#         AES_KEY = self.env['wechat.model'].appSecret
#         TOKEN = self.env['wechat.model'].token
#         signature = post.get('signature', '')
#         timestamp = post.get('timestamp', '')
#         nonce = post.get('nonce', '')
#         encrypt_type = post.get('encrypt_type', 'raw')
#         msg_signature = post.get('msg_signature', '')
#         return check_signature(TOKEN, signature, timestamp, nonce)
#
#
