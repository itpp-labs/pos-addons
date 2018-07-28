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
DUMMY_AUTH_CODE = '134579302432164181'
DUMMY_POS_ID = 1


class TestAlipayOrder(HttpCase):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestAlipayOrder, self).setUp()
        self.env['ir.config_parameter'].set_param('alipay.local_sandbox', '1')
        self.requests_mock = requests_mock.Mocker(real_http=True)
        self.requests_mock.start()
        self.addCleanup(self.requests_mock.stop)
        self.phantom_env = api.Environment(self.registry.test_cr, self.uid, {})

        self.Order = self.phantom_env['alipay.order']
        self.Refund = self.phantom_env['alipay.refund']
        self.product1 = self.phantom_env['product.product'].create({
            'name': 'Product1',
        })
        self.product2 = self.phantom_env['product.product'].create({
            'name': 'Product2',
        })

        #patcher = patch('alipay.AlipayPay.check_signature', wraps=lambda *args: True)
        #patcher.start()
        #self.addCleanup(patcher.stop)

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

    def test_alipay_object(self):
        """check that alipay object is passing without errors"""
        demo_user = self.env.ref('base.user_demo')
        # ISV account
        self.env['ir.config_parameter'].set_param('alipay.app_auth_code', 'dummycode')
        alipay = self.env['ir.config_parameter'].sudo(demo_user).get_alipay_object()
        self.assertTrue(alipay)

        # Normal account
        self.env['ir.config_parameter'].search([('key', '=', 'alipay.app_auth_code')]).unlink()
        alipay = self.env['ir.config_parameter'].sudo(demo_user).get_alipay_object()
        self.assertTrue(alipay)

    def _test_scan(self):
        """Test payment workflow from server side.

        * Cashier scanned buyer's QR and upload it to odoo server,
        odoo server sends information to alipay servers and wait for response with result.

        * Once user authorize the payment, odoo receives result syncroniosly from
        previously sent request.

        * Odoo sends result to POS via longpolling.

        Due to limititation of testing framework, we use syncronios call for testing

        """

        journal = self.env['account.journal'].search([('alipay', '=', 'scan')])

        # make request with scanned qr code (auth_code)
        msg = self.env['alipay.order'].create_from_qr(**{
            'auth_code': DUMMY_AUTH_CODE,
            'total_amount': 1,
            'journal_id': journal.id,
            'terminal_ref': 'POS/%s' % DUMMY_POS_ID,
            'order_ref': 'dummy out_trade_num',
            'subject': 'dummy subject',
        })
        self.assertTrue(msg.get('trade_no'), "Wrong result_code. The patch doesn't work?")

    def _test_show_payment(self):
        """ Create QR, emulate payment, make refund """

        order = self._create_order()

        # emulate notification
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


    # CODE BELOW IS NOT CHECKED
    def _patch_post(self, post_result):

        def post(url, data):
            self.assertIn(url, post_result)
            _logger.debug("Request data for %s: %s", url, data)
            return post_result[url]

        # patch alipay
        patcher = patch('alipay.pay.base.BaseAlipayPayAPI._post', wraps=post)
        patcher.start()
        self.addCleanup(patcher.stop)

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

    def _test_notification_duplicates(self):
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

