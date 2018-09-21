from __future__ import absolute_import, unicode_literals
from odoo import fields, models, api
from odoo.http import request
import json
import hashlib
import time
import requests


class AccountJournal(models.Model):
    _inherit = "account.journal"

    wechat_payment = fields.Boolean(string='Allow WeChat payments', default=False,
                                    help="Check this box if this account allows pay via WeChat")


# class PosOrder(models.Model):
#     _inherit = "pos.order"
#
#     auth_code = fields.Integer(string='Code obtained from customers QR or BarCode', default=0)


class WechatConfiguration(models.Model):
    _name = "wechat.config"

    # auth_code = fields.Integer(string='Code obtained from customers QR or BarCode', default=0)
    access_token = fields.Char(string='access_token')
    token_validity = fields.Float(string='validity time')

    @api.multi
    def getAccessToken(self):
        print('inside getAccessToken!!!!!!!!!!!', self.token_validity < time.time())
        if not self.token_validity:
            self.createVals()
        if self.token_validity < time.time():
            appId = request.env['ir.config_parameter'].get_param('wechat.appId')
            appSecret = request.env['ir.config_parameter'].get_param('wechat.appSecret')
            url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s" % (
                appId, appSecret)
            response = requests.get(url)
            access_token = json.loads(response.text)['access_token']
            self.write({'token_validity': time.time() + 7000, 'access_token': access_token})
        else:
            access_token = self.access_token
        return access_token

    def getIpList(self):
        token = self.getAccessToken()
        url = "https://api.wechat.com/cgi-bin/getcallbackip?access_token=%s" % token
        response = requests.get(url)
        return json.loads(response.text)['ip_list']

    def sortData(self, message):
        arrA = []
        data = message['data']
        for key in data:
            if data[key]:
                arrA.append(str(key) + '=' + str(data[key]))
        arrA.sort()
        return arrA

    def getRandomNumberGeneration(self, message):
        data = self.sortData(message)
        strA = ' & '.join(data)
        return hashlib.sha256(strA.encode('utf-8')).hexdigest().upper()

    def makeXmlPost(self, data):
        xml_str = ['<xml>']
        for key in sorted(data):
            if data[key]:
                xml_str.append('<' + str(key) + '>' + str(data[key]) + '</' + str(key) + '>')
        xml_str.append('</xml>')
        return '\n'.join(xml_str)
