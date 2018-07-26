# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import json
import requests_mock
import requests
try:
    from unittest.mock import patch
except ImportError:
    from mock import patch
from odoo.tests.common import HttpCase, HOST, PORT
from odoo import api


_logger = logging.getLogger(__name__)


class TestWeChatOrder(HttpCase):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestWeChatOrder, self).setUp()
        self.requests_mock = requests_mock.Mocker(real_http=True)
        self.requests_mock.start()
        self.addCleanup(self.requests_mock.stop)
        self.phantom_env = api.Environment(self.registry.test_cr, self.uid, {})

        self.Order = self.phantom_env['wechat.order']
        self.Refund = self.phantom_env['wechat.refund']
        self.product1 = self.phantom_env['product.product'].create({
            'name': 'Product1',
        })
        self.product2 = self.phantom_env['product.product'].create({
            'name': 'Product2',
        })

        patcher = patch('wechatpy.WeChatPay.check_signature', wraps=lambda *args: True)
        patcher.start()
        self.addCleanup(patcher.stop)

        self.lines = [
            {
                "product_id": self.product1.id,
                "name": "Product 1 Name",
                "quantity": 1,
                "price": 1,
                "category": "123456",
                "description": "翻译服务器错误",
            },
            {
                "product_id": self.product2.id,
                "name": "Product 2 Name",
                "quantity": 1,
                "price": 2,
                "category": "123456",
                "description": "網路白目哈哈",
            }
        ]

    def _patch_post(self, post_result):

        def post(url, data):
            self.assertIn(url, post_result)
            _logger.debug("Request data for %s: %s", url, data)
            return post_result[url]

        # patch wechat
        patcher = patch('wechatpy.pay.base.BaseWeChatPayAPI._post', wraps=post)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _patch_get_requests(self, url, response_json):
        self.requests_mock.register_uri('GET', url, json=response_json)

    def _create_order(self):
        post_result = {
            'pay/unifiedorder': {
                'code_url': 'weixin://wxpay/s/An4baqw',
                'trade_type': 'NATIVE',
                'result_code': 'SUCCESS',
            },
        }
        self._patch_post(post_result)
        order, code_url = self.Order._create_qr(self.lines, total_fee=300)
        self.assertEqual(order.state, 'draft', 'Just created order has wrong state')
        return order

    def _create_jsapi_order(self, create_vals, lines):
        post_result = {
            'pay/unifiedorder': {
                'trade_type': 'JSAPI',
                'result_code': 'SUCCESS',
                'prepay_id': 'qweqweqwesadsd2113',
                'nonce_str': 'wsdasd12312eaqsd21q3'
            }
        }
        self._patch_post(post_result)
        res = self.phantom_env['wechat.order'].create_jsapi_order(lines, create_vals)
        order = self.Order.browse(res.get('order_id'))
        self.assertEqual(order.state, 'draft', 'Just created order has wrong state')
        return res

    def url_open_json(self, url, code, user_info, timeout=10):
        headers = {
            'Content-Type': 'application/json'
        }
        params = {
            "context": {},
            "code": code,
            "user_info": user_info,
            "test_cr": True
        }
        data = {
            "jsonrpc": "2.0",
            "method": "call",
            "params": params,
            "id": None
        }
        json_data = json.dumps(data)
        if url.startswith('/'):
            url = "http://%s:%s%s" % (HOST, PORT, url)
        # Don't need to use self.opener.post because we need to make a request without session cookies.
        # (Mini-Program don't have session data)
        return requests.post(url, data=json_data, timeout=timeout, headers=headers)

    def _authenticate_miniprogram_user(self, code, user_info):
        response_json = {
            'openid': 'qwepo21pei90salje12',
            'session_key': 'qweafjqwhoieuojeqwe4213',
        }
        url = "/wechat/miniprogram/authenticate"
        base_url = 'https://api.weixin.qq.com/sns/jscode2session'
        self._patch_get_requests(base_url, response_json)
        res = self.url_open_json(url, code, user_info, 60)
        self.assertEqual(res.status_code, 200)
        return res.json()

    def test_native_payment(self):
        """ Create QR, emulate payment, make refund """

        order = self._create_order()

        # simulate notification
        notification = {
            'return_code': 'SUCCESS',
            'result_code': 'SUCCESS',
            'out_trade_no': order.name,
        }
        handled = self.Order.on_notification(notification)
        self.assertTrue(handled, 'Notification was not handled (error in checking for duplicates?)')
        self.assertEqual(order.state, 'done', "Order's state is not changed after notification about update")

        # refund
        post_result = {
            'secapi/pay/refund': {
                'trade_type': 'NATIVE',
                'result_code': 'SUCCESS',
            },
        }
        self._patch_post(post_result)

        refund_fee = 100
        refund_vals = {
            'order_id': order.id,
            'total_fee': order.total_fee,
            'refund_fee': refund_fee,
        }
        refund = self.Refund.create(refund_vals)
        self.assertEqual(order.refund_fee, 0, "Order's refund ammout is not zero when refund is not confirmed")
        refund.action_confirm()
        self.assertEqual(refund.state, 'done', "Refund's state is not changed after refund is confirmed")
        self.assertEqual(order.state, 'refunded', "Order's state is not changed after refund is confirmed")
        self.assertEqual(order.refund_fee, refund_fee, "Order's refund amount is computed wrongly")

        refund = self.Refund.create(refund_vals)
        refund.action_confirm()
        self.assertEqual(order.refund_fee, 2 * refund_fee, "Order's refund amount is computed wrongly")

    def test_JSAPI_payment(self):
        # fake values for a test
        create_vals = {}

        res = self._create_jsapi_order(create_vals=create_vals, lines=self.lines)

        data = res.get('data')
        order_id = res.get('order_id')
        order = self.Order.browse(order_id)

        self.assertIn('timeStamp', data, 'JSAPI payment: "timeStamp" not found in data')
        self.assertIn('nonceStr', data, 'JSAPI payment: "nonceStr" not found in data')
        self.assertIn('package', data, 'JSAPI payment: "package" not found in data')
        self.assertIn('signType', data, 'JSAPI payment: "signType" not found in data')
        self.assertIn('paySign', data, 'JSAPI payment: "paySign" not found in data')

        # simulate notification
        notification = {
            'return_code': 'SUCCESS',
            'result_code': 'SUCCESS',
            'out_trade_no': order.name,
        }

        handled = self.Order.on_notification(notification)
        self.assertTrue(handled, 'Notification was not handled (error in checking for duplicates?)')
        handled = self.Order.on_notification(notification)
        self.assertFalse(handled, 'Duplicate was not catched and handled as normal notificaiton')

    def test_notification_duplicates(self):
        order = self._create_order()

        # simulate notification with failing request
        notification = {
            'return_code': 'SUCCESS',
            'result_code': 'FAIL',
            'error_code': 'SYSTEMERR',
            # 'transaction_id': '121775250120121775250120',
            'out_trade_no': order.name,
        }
        handled = self.Order.on_notification(notification)
        self.assertTrue(handled, 'Notification was not handled (error in checking for duplicates?)')
        handled = self.Order.on_notification(notification)
        self.assertFalse(handled, 'Duplicate was not catched and handled as normal notificaiton')

    def test_authenticate_miniprogram_user(self):
        # fake values for a test
        code = "ksdjfwopeiq120jkahs"
        user_info = {
            'country': 'Russia',
            'nickName': 'Test User',
            'city': 'Moscow',
        }
        session_info = self._authenticate_miniprogram_user(code, user_info).get('result')
        self.assertIn('session_id', session_info, 'Authenticate user: "session_id" not found in data')
