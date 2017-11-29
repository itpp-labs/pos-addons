import datetime, time
import random
import logging
import json
import odoo
from odoo.http import request
from odoo.tools.misc import DEFAULT_SERVER_DATETIME_FORMAT
_logger = logging.getLogger(__name__)
import requests

try:
    from odoo.addons.bus.controllers.main import BusController
except ImportError:
    _logger.error('pos_multi_session_sync inconsisten with odoo version')
    BusController = object


class Controller(BusController):

    @odoo.http.route('/wechat/test', type="json", auth="public")
    def testAccessToken(self, message):
        order_id = '{0:06}'.format(message['data']['order_id'])
        cashier_id = '{0:05}'.format(message['data']['cashier_id'])
        session_id = '{0:05}'.format(message['data']['session_id'])

        appid = request.env['ir.config_parameter'].get_param('wechat.appId')
        mch_id = request.env['ir.config_parameter'].get_param('wechat.mchId')

        out_trade_no = str(time.time()).replace('.', '') \
                       + '{0:010}'.format(random.randint(1, 9999999999)) \
                       + '{0:010}'.format(random.randint(1, 9999999999))
        wcc = request.env['wechat.config']
        if not wcc:
            wcc = wcc.create({
                'token_validity': 7000,
                'access_token': 'test'
            })
        wcc.getAccessToken()

    @odoo.http.route('/wechat/payment', type="json", auth="public")
    def micropay(self, message):
        data = message['data']
        data['order_id'] = '{0:06}'.format(message['data']['order_id'])
        data['cashier_id'] = '{0:05}'.format(message['data']['cashier_id'])
        data['session_id'] = '{0:05}'.format(message['data']['session_id'])

        data['appid'] = request.env['ir.config_parameter'].get_param('wechat.appId')
        data['mch_id'] = request.env['ir.config_parameter'].get_param('wechat.mchId')
        data['body'] = message['data']['order_short']

        data['out_trade_no'] = str(time.time()).replace('.', '') \
            + '{0:010}'.format(random.randint(1, 9999999999)) \
            + '{0:010}'.format(random.randint(1, 9999999999))
        wcc = request.env['wechat.config']
        if not wcc:
            wcc = wcc.create({
                'token_validity': 1,
                'access_token': ''
            })
        # data['total_fee'] = message['data']['total_fee']
        data['spbill_create_ip'] = wcc.getIpList()[1]
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
        data['nonce_str'] = wcc.getRandomNumberGeneration(message)
        data['sign'] = wcc.getRandomNumberGeneration(message)

        post = wcc.makeXmlPost(data)
        print(post)
        r = requests.post("https://api.mch.weixin.qq.com/sandbox/pay/micropay", data=post)
        print(r)
        print(r.status_code)
        print(r.headers)
        print(r.headers['content-type'])
        print(r.encoding)
        print(r.text)
