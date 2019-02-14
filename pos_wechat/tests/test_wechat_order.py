# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
try:
    from unittest.mock import patch
except ImportError:
    from mock import patch

from odoo.addons.point_of_sale.tests.common import TestPointOfSaleCommon


_logger = logging.getLogger(__name__)
DUMMY_AUTH_CODE = '134579302432164181'
DUMMY_POS_ID = 1


class TestWeChatOrder(TestPointOfSaleCommon):
    at_install = True
    post_install = True

    def setUp(self):
        super(TestWeChatOrder, self).setUp()
        # create wechat journals
        self.pos_config.init_pos_wechat_journals()

        self.Order = self.env['wechat.order']
        self.Refund = self.env['wechat.refund']
        self.product1 = self.env['product.product'].create({
            'name': 'Product1',
        })
        self.product2 = self.env['product.product'].create({
            'name': 'Product2',
        })

    def _patch_post(self, post_result):
        def post(url, data):
            self.assertIn(url, post_result)
            _logger.debug("Request data for %s: %s", url, data)
            return post_result[url]

        # patch wechat
        patcher = patch('wechatpy.pay.base.BaseWeChatPayAPI._post', wraps=post)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _create_pos_order(self):

        def compute_tax(product, price, qty=1, taxes=None):
            if taxes is None:
                taxes = product.taxes_id.filtered(lambda t: t.company_id.id == self.env.user.id)
            currency = self.pos_config.pricelist_id.currency_id
            res = taxes.compute_all(price, currency, qty, product=product)
            untax = res['total_excluded']
            return untax, sum(tax.get('amount', 0.0) for tax in res['taxes'])

        # I click on create a new session button
        self.pos_config.open_session_cb()

        # I create a PoS order with 2 units of PCSC234 at 450 EUR
        # and 3 units of PCSC349 at 300 EUR.
        untax1, atax1 = compute_tax(self.product3, 450, 2)
        untax2, atax2 = compute_tax(self.product4, 300, 3)
        order = self.PosOrder.create({
            'company_id': self.company_id,
            'pricelist_id': self.partner1.property_product_pricelist.id,
            'partner_id': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'product_id': self.product3.id,
                'price_unit': 450,
                'discount': 0.0,
                'qty': 2.0,
                'tax_ids': [(6, 0, self.product3.taxes_id.ids)],
                'price_subtotal': untax1,
                'price_subtotal_incl': untax1 + atax1,
            }), (0, 0, {
                'name': "OL/0002",
                'product_id': self.product4.id,
                'price_unit': 300,
                'discount': 0.0,
                'qty': 3.0,
                'tax_ids': [(6, 0, self.product4.taxes_id.ids)],
                'price_subtotal': untax2,
                'price_subtotal_incl': untax2 + atax2,
            })],
            'amount_tax': atax1 + atax2,
            'amount_total': untax1 + untax2 + atax1 + atax2,
            'amount_paid': 0,
            'amount_return': 0,
        })
        return order

    def _create_wechat_order(self):
        post_result = {
            'pay/unifiedorder': {
                'code_url': 'weixin://wxpay/s/An4baqw',
                'trade_type': 'NATIVE',
                'result_code': 'SUCCESS',
            },
        }
        self.lines = [
            {
                "product_id": self.product1.id,
                "name": "Product 1 Name",
                "quantity": 2,
                "price": 450,
                "category": "123456",
                "description": "翻译服务器错误",
            },
            {
                "product_id": self.product2.id,
                "name": "Product 2 Name",
                "quantity": 3,
                "price": 300,
                "category": "123456",
                "description": "網路白目哈哈",
            }
        ]
        self._patch_post(post_result)
        order, code_url = self.Order._create_qr(self.lines, total_fee=300)
        self.assertEqual(order.state, 'draft', 'Just created order has wrong state')
        return order

    def test_refund(self):
        # Order are not really equal because I'm lazy
        # Just imagine that they are correspond each other
        order = self._create_pos_order()
        wechat_order = self._create_wechat_order()

        order.wechat_order_id = wechat_order.id

        # patch refund api request
        post_result = {
            'secapi/pay/refund': {
                'trade_type': 'NATIVE',
                'result_code': 'SUCCESS',
            },
        }
        self._patch_post(post_result)

        # I create a refund
        refund_action = order.refund()
        refund = self.PosOrder.browse(refund_action['res_id'])

        wechat_journal = self.env['account.journal'].search([('wechat', '=', 'native')])

        payment_context = {"active_ids": refund.ids, "active_id": refund.id}
        refund_payment = self.PosMakePayment.with_context(**payment_context).create({
            'amount': refund.amount_total,
            'journal_id': wechat_journal.id,
            'wechat_order_id': wechat_order.id,
        })

        # I click on the validate button to register the payment.
        refund_payment.with_context(**payment_context).check()

        self.assertEqual(refund.state, 'paid', "The refund is not marked as paid")

        self.assertEqual(wechat_order.state, 'refunded', "Wechat Order state is not changed after making refund payment")
