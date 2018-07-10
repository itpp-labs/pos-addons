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

    @api.model
    def _body(self, terminal_ref, **kwargs):
        return "%s - Products" % terminal_ref

    @api.model
    def create_qr(self):
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
