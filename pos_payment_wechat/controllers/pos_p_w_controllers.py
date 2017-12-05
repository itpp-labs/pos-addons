from __future__ import unicode_literals
import time
import random
import logging
import requests
import odoo
import json
from odoo.http import request

_logger = logging.getLogger(__name__)

try:
    from odoo.addons.bus.controllers.main import BusController
except ImportError:
    _logger.error('pos_multi_session_sync inconsisten with odoo version')
    BusController = object


class Controller(BusController):

    @odoo.http.route('/wechat/getsignkey', type="json", auth="public")
    def getSignKey(self, message):
        data = {}
        data['mch_id'] = request.env['ir.config_parameter'].get_param('wechat.mchId')
        wcc = request.env['wechat.config']
        data['nonce_str'] = (wcc.getRandomNumberGeneration(message))[:32]
        data['sign'] = data['nonce_str']
        post = wcc.makeXmlPost(data)
        print(post)
        url = "https://api.mch.weixin.qq.com/sandboxnew/pay/getsignkey"
        r1 = requests.post(url, data=post)
        print(r1)
        print(r1.status_code)
        print(r1.headers)
        print(r1.headers['content-type'])
        print(r1.text, len(r1.text))
        print(r1.content, len(r1.content))
        print(r1.iter_content)

        # print(r1.mch_id)
        # print(r1.sandbox_signkey)
        for key in r1.text:
            print(key, '----')
        for key in r1.content:
            print(key, '====')
        message = {}
        message['resp1'] = r1.text
        return message

    @odoo.http.route('/wechat/test', type="json", auth="public")
    def testAccessToken(self, message):
        wcc = request.env['wechat.config']
        if not wcc:
            wcc = wcc.create({
                'token_validity': 7000,
                'access_token': 'test'
            })
        wcc.getAccessToken()

    @odoo.http.route('/wechat/payment_commence', type="json", auth="public")
    def micropay(self, message):
        # data = message['data']
        # data['order_id'] = '{0:06}'.format(message['data']['order_id'])
        # data['cashier_id'] = '{0:05}'.format(message['data']['cashier_id'])
        # data['session_id'] = '{0:05}'.format(message['data']['session_id'])
        data = {}
        data['auth_code'] = message['data']['auth_code']
        data['appid'] = request.env['ir.config_parameter'].get_param('wechat.appId')
        data['mch_id'] = request.env['ir.config_parameter'].get_param('wechat.mchId')
        data['body'] = message['data']['order_short']

        data['out_trade_no'] = (str(time.time()).replace('.', '') \
            + '{0:010}'.format(random.randint(1, 9999999999)) \
            + '{0:010}'.format(random.randint(1, 9999999999)))[:32]
        wcc = request.env['wechat.config']
        if not wcc:
            wcc = wcc.create({
                'token_validity': 1,
                'access_token': ''
            })
        data['total_fee'] = message['data']['total_fee']
        data['spbill_create_ip'] = wcc.getIpList()[0]
        print(wcc.getIpList())
        # data['auth_code'] = message['data']['auth_code']
        #
        # device_info =
        # sign_type =
        # detail =
        # attach =
        # fee_type =
        # goods_tag =
        # limit_pay =
        # scene_info =
        #
        data['nonce_str'] = (wcc.getRandomNumberGeneration(message))[:32]
        data['sign'] = (wcc.getRandomNumberGeneration(message))[:32]

        post = wcc.makeXmlPost(data)
        print(post)
        r1 = requests.post("https://api.mch.weixin.qq.com/sandboxnew/pay/micropay", data=post)
        print(r1)
        print(r1.status_code)
        print(r1.headers)
        print(r1.headers['content-type'])
        print(r1.encoding)
        message = {}
        message['resp1'] = r1
        message['encode_text1'] = r1.text.encode('iso-8859-1').decode('utf-8')
        # print(r1.text.encode('utf-8'))
        time.sleep(5)
    #     return request.redirect('/wechat/payment_query')
    #
    # @odoo.http.route('/wechat/payment_query', type="json", auth="public")
    # def queryOrderApi(self, message):
        data_qa = {}
        data_qa['appid'] = data['appid']
        data_qa['mch_id'] = data['mch_id']
        data_qa['out_trade_no'] = data['out_trade_no']
        data_qa['nonce_str'] = data['nonce_str']
        data_qa['sign'] = data['sign']
        if hasattr(data, 'sign_type'):
            data_qa['sign_type'] = data['sign_type']

        post = wcc.makeXmlPost(data_qa)
        print(post)
        r2 = requests.post("https://api.mch.weixin.qq.com/sandboxnew/pay/orderquery", data=post)
        print(r2)
        print(r2.status_code)
        print(r2.headers)
        print(r2.headers['content-type'])
        print(r2.encoding)
        message['resp2'] = r2
        message['encode_text2'] = r2.text.encode('iso-8859-1').decode('utf-8')
        # with open('txt.txt', 'w+') as fil:
        #     fil.write(r1.text, r2.text)
        # print(r2.text.encode('utf-8'))
        # for each_unicode_character in r2.text.encode('utf-8').decode('utf-8'):
        #     print(each_unicode_character)
        # print(message['encode_text1'])
        # print(message['encode_text2'])
        return message
