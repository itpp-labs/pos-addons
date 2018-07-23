# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import json

from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class Micropay(models.Model):

    _name = 'wechat.micropay'
    _rec_name = 'order_ref'

    order_ref = fields.Char('Order Reference', readonly=True)
    terminal_ref = fields.Char('Terminal Reference', help='e.g. POS Name', readonly=True)
    total_fee = fields.Integer('Total Fee', help='Amount in cents', readonly=True)
    debug = fields.Boolean('Sandbox', help="Payment was not made. It's only for testing purposes", readonly=True)
    result_raw = fields.Text('Raw result', readonly=True)
    journal_id = fields.Many2one('account.journal')
    state = fields.Selection([
        ('done', 'Paid'),
        ('error', 'Error'),
        ('refunded', 'Refunded (part of full amount)'),
    ], string='State', default='done')

    @api.model
    def _body(self, terminal_ref, **kwargs):
        return "%s - Products" % terminal_ref

    @api.model
    def create_from_qr(self, body, auth_code, pay_amount, terminal_ref=None, create_vals=None, order_ref=None, **kwargs):
        """
        :param product_category: is used to prepare "body"
        :param pay_amount: Specifies the amount to pay. The units are in currency units (not cents)
        :param create_vals: extra args to pass on record creation
        """
        total_fee = int(100*pay_amount)
        debug = self.env['ir.config_parameter'].get_param('wechat.local_sandbox') == '1'
        if debug:
            _logger.info('SANDBOX is activated. Request to wechat servers are not sending')
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
            'journal_id': kwargs['journal_id'],
            'debug': debug,
        }
        if create_vals:
            vals.update(create_vals)
        record = self.create(vals)
        return record
