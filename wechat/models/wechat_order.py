# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import json

from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class WeChatOrder(models.Model):
    """Records with order information and payment status.

    Can be used for different types of Payments. See description of trade_type field. """

    _name = 'wechat.order'
    _description = 'Unified Order'
    _rec_name = 'order_ref'

    trade_type = fields.Selection([
        ('JSAPI', 'Official Account Payment (Mini Program)'),
        ('NATIVE', 'Native Payment'),
        ('APP', 'In-App Payment'),
    ], help="""
* Official Account Payment -- Mini Program Payment or In-App Web-based Payment
* Native Payment -- Customer scans QR for specific order and confirm payment
* In-App Payment -- payments in native mobile applications
    """)

    order_ref = fields.Char('Order Reference', readonly=True)
    total_fee = fields.Integer('Total Fee', help='Amount in cents', readonly=True)

    # terminal_ref = fields.Char('Terminal Reference', help='e.g. POS Name', readonly=True)
    debug = fields.Boolean('Sandbox', help="Payment was not made. It's only for testing purposes", readonly=True)
    order_details_raw = fields.Text('Raw Order', readonly=True)
    result_raw = fields.Text('Raw result', readonly=True)
    line_ids = fields.One2many('wechat.order.line')


    def _body(self):
        """ Example of result:

        {"goods_detail": [
            {
                "goods_id": "iphone6s_16G",
                "wxpay_goods_id": "100 1",
                "goods_name": "iPhone 6s 16G",
                "goods_num": 1,
                "price": 100,
                "goods_category": "123456",
                "body": "苹果手机",
            },
            {
                "goods_id": "iphone6s_3 2G",
                "wxpay_goods_id": "100 2",
                "goods_name": "iPhone 6s 32G",
                "quantity": 1,
                "price": 200,
                "goods_category": "123789",
            }
        ]}"""
        self.ensure_one()
        # TODO


    @api.model
    def create_qr(self, lines, total_fee, **kwargs):
        """Native Payment

        :param lines: list of dictionary
        :param total_fee: amount in cents
        """
        debug = self.env['ir.config_parameter'].get_param('wechat.local_sandbox') == '1'
        if debug:
            _logger.info('SANDBOX is activated. Request to wechat servers is not sending')
            # Dummy Data. Change it to try different scenarios
            result_json = {
                'return_code': 'SUCCESS',
                'result_code': 'SUCCESS',
                'openid': '123',
                'total_fee': total_fee,
                'order_ref': order_ref,
            }
            if self.env.context.get('debug_micropay_response'):
                result_json = self.env.context.get('debug_micropay_response')
        else:
            wpay = self.env['ir.config_parameter'].get_wechat_pay_object()
            result_json = wpay.micropay.create(
                body,
                total_fee,
                auth_code,
            )

        result_raw = json.dumps(result_json)
        _logger.debug('result_raw: %s', result_raw)
        vals = {
            'terminal_ref': terminal_ref,
            'order_ref': order_ref,
            'result_raw': result_raw,
            'total_fee': result_json['total_fee'],
            'debug': debug,
        }
        if create_vals:
            vals.update(create_vals)
        record = self.create(vals)
        return record


class WeChatOrderLine(models.Model):
    _inherit = 'wechat.order.line'

    name = fields.Char('Name', help="When empty, product's name is used")
    description = fields.Char('Body')
    product_id = fields.Many2one('product.product', required=True)
    wxpay_goods_ID = fields.Char('Wechat Good ID')
    price = fields.Monetary('Price', required=True, help='Price in currency units (not cents)')
    quantity = fields.Char('Quantity', default=1)
    category = fields.Char('Category')
