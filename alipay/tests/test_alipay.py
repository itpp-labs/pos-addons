# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import json
import logging

import requests_mock

from odoo.tests.common import TransactionCase

try:
    from unittest.mock import patch
except ImportError:
    from mock import patch


_logger = logging.getLogger(__name__)
DUMMY_AUTH_CODE = "134579302432164181"
DUMMY_POS_ID = 1
STATUS_SUCCESS = "10000"


class TestAlipayOrder(TransactionCase):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestAlipayOrder, self).setUp()
        self.env["ir.config_parameter"].set_param("alipay.local_sandbox", "1")
        self.requests_mock = requests_mock.Mocker(real_http=True)
        self.requests_mock.start()
        self.addCleanup(self.requests_mock.stop)

        context = dict(app_private_key_string=DUMMY_RSA_KEY,)

        self.Config = self.env["ir.config_parameter"].with_context(context)
        self.Order = self.env["alipay.order"].with_context(context)
        self.Refund = self.env["alipay.refund"]
        self.product1 = self.env["product.product"].create({"name": "Product1"})
        self.product2 = self.env["product.product"].create({"name": "Product2"})

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
            },
        ]

    def test_alipay_object(self):
        """check that alipay object is passing without errors"""
        demo_user = self.env.ref("base.user_demo")
        # ISV account
        self.Config.set_param("alipay.app_auth_code", "dummycode")
        alipay = self.Config.sudo(demo_user).get_alipay_object()
        self.assertTrue(alipay)

        # Normal account
        self.Config.search([("key", "=", "alipay.app_auth_code")]).unlink()
        alipay = self.Config.sudo(demo_user).get_alipay_object()
        self.assertTrue(alipay)

    def test_scan(self):
        """Test payment workflow from server side.

        * Cashier scanned buyer's QR and upload it to odoo server,
        odoo server sends information to alipay servers and wait for response with result.

        * Once user authorize the payment, odoo receives result syncroniosly from
        previously sent request.

        * Odoo sends result to POS via longpolling.

        Due to limititation of testing framework, we use syncronios call for testing

        """

        journal = self.env["account.journal"].search([("alipay", "=", "scan")])

        # make request with scanned qr code (auth_code)
        order = self.Order._create_from_qr(
            **{
                "auth_code": DUMMY_AUTH_CODE,
                "total_amount": 1,
                "journal_id": journal.id,
                "terminal_ref": "POS/%s" % DUMMY_POS_ID,
                "order_ref": "dummy out_trade_num",
                "subject": "dummy subject",
            }
        )
        result_json = json.loads(order.result_raw)
        self.assertTrue(
            result_json.get("trade_no"), "Wrong result_code. The patch doesn't work?"
        )

    # CODE BELOW IS NOT CHECKED
    def _test_show_payment(self):
        """ Create QR, emulate payment, make refund """

        order = self._create_order()

        # emulate notification
        notification = {
            "return_code": "SUCCESS",
            "result_code": "SUCCESS",
            "out_trade_no": order.name,
        }
        handled = self.Order.on_notification(notification)
        self.assertTrue(
            handled, "Notification was not handled (error in checking for duplicates?)"
        )
        self.assertEqual(
            order.state,
            "done",
            "Order's state is not changed after notification about update",
        )

        # refund
        post_result = {
            "secapi/pay/refund": {"trade_type": "NATIVE", "result_code": "SUCCESS"},
        }
        self._patch_post(post_result)

        refund_fee = 100
        refund_vals = {
            "order_id": order.id,
            "total_fee": order.total_fee,
            "refund_fee": refund_fee,
        }
        refund = self.Refund.create(refund_vals)
        self.assertEqual(
            order.refund_fee,
            0,
            "Order's refund ammout is not zero when refund is not confirmed",
        )
        refund.action_confirm()
        self.assertEqual(
            refund.state,
            "done",
            "Refund's state is not changed after refund is confirmed",
        )
        self.assertEqual(
            order.state,
            "refunded",
            "Order's state is not changed after refund is confirmed",
        )
        self.assertEqual(
            order.refund_fee, refund_fee, "Order's refund amount is computed wrongly"
        )

        refund = self.Refund.create(refund_vals)
        refund.action_confirm()
        self.assertEqual(
            order.refund_fee,
            2 * refund_fee,
            "Order's refund amount is computed wrongly",
        )

    def _patch_post(self, post_result):
        def post(url, data):
            self.assertIn(url, post_result)
            _logger.debug("Request data for %s: %s", url, data)
            return post_result[url]

        # patch alipay
        patcher = patch("alipay.pay.base.BaseAlipayPayAPI._post", wraps=post)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _create_order(self):
        post_result = {
            "pay/unifiedorder": {
                "code_url": "weixin://wxpay/s/An4baqw",
                "trade_type": "NATIVE",
                "result_code": "SUCCESS",
            },
        }
        self._patch_post(post_result)
        order, code_url = self.Order._create_qr(self.lines, total_fee=300)
        self.assertEqual(order.state, "draft", "Just created order has wrong state")
        return order

    def _test_notification_duplicates(self):
        order = self._create_order()

        # simulate notification with failing request
        notification = {
            "return_code": "SUCCESS",
            "result_code": "FAIL",
            "error_code": "SYSTEMERR",
            # 'transaction_id': '121775250120121775250120',
            "out_trade_no": order.name,
        }
        handled = self.Order.on_notification(notification)
        self.assertTrue(
            handled, "Notification was not handled (error in checking for duplicates?)"
        )
        handled = self.Order.on_notification(notification)
        self.assertFalse(
            handled, "Duplicate was not catched and handled as normal notificaiton"
        )


DUMMY_RSA_KEY = """-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----
"""
