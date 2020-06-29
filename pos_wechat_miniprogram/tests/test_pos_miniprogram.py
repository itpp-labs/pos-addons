# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import api
from odoo.tests.common import HttpCase

try:
    from unittest.mock import patch
except ImportError:
    from mock import patch


_logger = logging.getLogger(__name__)


class TestPOSMiniProgram(HttpCase):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestPOSMiniProgram, self).setUp()
        self.phantom_env = api.Environment(self.registry.test_cr, self.uid, {})
        self.user = self.phantom_env.user
        self.user.write({"number_verified": True})

        self.partner = self.user.partner_id

        self.partner.write({"mobile": "+1234567890"})

        self.Order = self.phantom_env["pos.miniprogram.order"]

        self.product1 = self.phantom_env["product.product"].create({"name": "Product1"})
        self.product2 = self.phantom_env["product.product"].create({"name": "Product2"})

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

        self.create_vals = {
            "name": "Test Order",
            "note": "This is test Order note",
            "table_id": 1,
            "floor_id": 1,
            "customer_count": 4,
            "packing_methods": "eat_in",
            "to_invoice": True,
        }

        # add patch
        patcher_possible_number = patch(
            "phonenumbers.is_possible_number", wraps=lambda *args: True
        )
        patcher_possible_number.start()
        self.addCleanup(patcher_possible_number.stop)

        patcher_valid_number = patch(
            "phonenumbers.is_valid_number", wraps=lambda *args: True
        )
        patcher_valid_number.start()
        self.addCleanup(patcher_valid_number.stop)

        patcher = patch("wechatpy.WeChatPay.check_signature", wraps=lambda *args: True)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _patch_post_requests(self, response_json, patch_url):
        def api_request(url=None, req=None, httpclient=None):
            _logger.debug("Request data: req - %s, httpclient - %s", req, httpclient)
            return response_json

        patcher = patch(patch_url, wraps=api_request)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _create_from_miniprogram_ui(self, create_vals, lines):
        post_result = {
            "pay/unifiedorder": {
                "trade_type": "JSAPI",
                "result_code": "SUCCESS",
                "prepay_id": "qweqweqwesadsd2113",
                "nonce_str": "wsdasd12312eaqsd21q3",
            }
        }

        def post(url, data):
            _logger.debug("Request data for %s: %s", url, data)
            return post_result[url]

        # patch wechat
        patcher = patch("wechatpy.pay.base.BaseWeChatPayAPI._post", wraps=post)
        patcher.start()
        self.addCleanup(patcher.stop)

        return self.phantom_env["pos.miniprogram.order"].create_from_miniprogram_ui(
            lines, create_vals
        )

    def test_create_and_pay_from_miniprogram_ui(self):
        """
        Create order from mini-program UI, pay, and send the Order to POS
        """
        # Pay method ('instant_payment' - Pay from mini-program, 'deffered_payment' - Pay from POS)
        self.create_vals["payment_method"] = "instant_payment"
        res = self._create_from_miniprogram_ui(
            create_vals=self.create_vals, lines=self.lines
        )
        order = self.Order.search([("wechat_order_id", "=", res.get("order_id"))])
        self.assertEqual(order.state, "draft", "Just created order has wrong state. ")

    # TODO: fix that test
    # def test_create_without_pay_from_miniprogram_ui(self):
    #     """
    #     Create order from mini-program UI and send the Order to POS
    #     """
    #     # Pay method ('instant_payment' - Pay from mini-program, 'deffered_payment' - Pay from POS)
    #     self.create_vals["payment_method"] = "deffered_payment"
    #     order = self._create_from_miniprogram_ui(
    #         create_vals=self.create_vals, lines=self.lines
    #     )
    #     self.assertEqual(order.state, "draft", "Just created order has wrong state. ")
