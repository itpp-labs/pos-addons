# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo.addons.alipay.tests.test_alipay import DUMMY_RSA_KEY
from odoo.addons.point_of_sale.tests.common import TestPointOfSaleCommon

_logger = logging.getLogger(__name__)
DUMMY_AUTH_CODE = "134579302432164181"
DUMMY_POS_ID = 1


class TestAlipayOrder(TestPointOfSaleCommon):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestAlipayOrder, self).setUp()
        self.env["ir.config_parameter"].set_param("alipay.local_sandbox", "1")

        # create alipay journals
        self.pos_config.init_pos_alipay_journals()
        context = dict(app_private_key_string=DUMMY_RSA_KEY,)

        self.Config = self.env["ir.config_parameter"].with_context(context)
        self.Order = self.env["alipay.order"].with_context(context)
        self.Refund = self.env["alipay.refund"].with_context(context)
        self.PosMakePayment = self.PosMakePayment.with_context(context)
        self.product1 = self.env["product.product"].create({"name": "Product1"})
        self.product2 = self.env["product.product"].create({"name": "Product2"})

    def _create_pos_order(self):
        # I create a new PoS order with 2 lines
        order = self.PosOrder.create(
            {
                "company_id": self.company_id,
                "partner_id": self.partner1.id,
                "pricelist_id": self.partner1.property_product_pricelist.id,
                "lines": [
                    (
                        0,
                        0,
                        {
                            "name": "OL/0001",
                            "product_id": self.product3.id,
                            "price_unit": 450,
                            "discount": 5.0,
                            "qty": 2.0,
                            "tax_ids": [(6, 0, self.product3.taxes_id.ids)],
                        },
                    ),
                    (
                        0,
                        0,
                        {
                            "name": "OL/0002",
                            "product_id": self.product4.id,
                            "price_unit": 300,
                            "discount": 5.0,
                            "qty": 3.0,
                            "tax_ids": [(6, 0, self.product4.taxes_id.ids)],
                        },
                    ),
                ],
            }
        )
        return order

    def _create_alipay_order(self):
        self.lines = [
            {
                "product_id": self.product1.id,
                "name": "Product 1 Name",
                "quantity": 2,
                "price": 4.50,
                "category": "123456",
                "description": "翻译服务器错误",
            },
            {
                "product_id": self.product2.id,
                "name": "Product 2 Name",
                "quantity": 3,
                "price": 3.0,
                "category": "123456",
                "description": "網路白目哈哈",
            },
        ]
        order, code_url = self.Order._create_qr(
            self.lines, "Test Order", total_amount=3.0
        )
        self.assertEqual(order.state, "draft", "Just created order has wrong state")
        return order

    def test_refund(self):
        # Order are not really equal because I'm lazy
        # Just imagine that they are correspond each other
        order = self._create_pos_order()
        alipay_order = self._create_alipay_order()
        order.alipay_order_id = alipay_order.id

        # I create a refund
        refund_action = order.refund()
        refund = self.PosOrder.browse(refund_action["res_id"])

        alipay_journal = self.env["account.journal"].search([("alipay", "=", "show")])

        payment_context = {"active_ids": refund.ids, "active_id": refund.id}
        refund_payment = self.PosMakePayment.with_context(**payment_context).create(
            {
                "amount": refund.amount_total,
                "journal_id": alipay_journal.id,
                "alipay_order_id": alipay_order.id,
            }
        )

        # I click on the validate button to register the payment.
        refund_payment.with_context(**payment_context).check()

        self.assertEqual(refund.state, "paid", "The refund is not marked as paid")

        self.assertEqual(
            alipay_order.state,
            "refunded",
            "Alipay Order state is not changed after making refund payment",
        )

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
        msg = self.env["alipay.order"].pos_create_from_qr_sync(
            **{
                "auth_code": DUMMY_AUTH_CODE,
                "terminal_ref": "POS/%s" % DUMMY_POS_ID,
                "pos_id": DUMMY_POS_ID,
                "journal_id": journal.id,
                "total_amount": 1,
                "subject": "Order #1",
            }
        )
        self.assertEqual(
            msg.get("code"), "10003", "Wrong result code. The patch doesn't work?"
        )
