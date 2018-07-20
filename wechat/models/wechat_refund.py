# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import json

from odoo import models, fields, api
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)

try:
    from wechatpy.exceptions import WeChatPayException
except ImportError as err:
    _logger.debug(err)


SUCCESS = 'SUCCESS'


class WeChatRefund(models.Model):
    """Records with refund information and payment status.

    Can be used for different types of Payments. See description of trade_type field. """

    _name = 'wechat.refund'
    _description = 'Unified Refund'

    name = fields.Char('Name', readonly=True)
    refund_ref = fields.Char('Refund Reference', readonly=True)
    refund_fee = fields.Integer('Refund Fee', help='Amount in cents', readonly=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('done', 'Completed'),
        ('error', 'Error'),
    ], string='State', default='draft')
    debug = fields.Boolean('Sandbox', help="Refund was not made. It's only for testing purposes", readonly=True)
    refund_details_raw = fields.Text('Raw Refund', readonly=True)
    result_raw = fields.Text('Raw result', readonly=True)
    currency_id = fields.Many2one('res.currency', default=lambda self: self.env.user.company_id.currency_id)
    order_id = fields.Many2one('wechat.order', required=True)
    journal_id = fields.Many2one('account.journal')

    @api.model
    def create(self, vals):
        vals['name'] = self.env['ir.sequence'].next_by_code('wechat.refund')
        return super(WeChatRefund, self).create(vals)

    def action_confirm(self):
        self.ensure_one()
        debug = self.env['ir.config_parameter'].get_param('wechat.local_sandbox') == '1'
        wpay = self.env['ir.config_parameter'].get_wechat_pay_object()
        if debug:
            _logger.info('SANDBOX is activated. Request to wechat servers is not sending')
            # Dummy Data. Change it to try different scenarios
            if self.env.context.get('debug_wechat_refund_response'):
                result_raw = self.env.context.get('debug_wechat_order_response')
            else:
                result_raw = {
                    'return_code': 'SUCCESS',
                    'result_code': 'SUCCESS',
                    'transaction_id': '12177525012014',
                    'refund_id': '12312122222',
                }

        else:
            wpay = self.env['ir.config_parameter'].get_wechat_pay_object()
            result_raw = wpay.refund.apply(
                self.order_id.total_fee,
                self.refund_fee,
                self.name,
            )

        vals = {
            'result_raw': json.dumps(result_raw),
            'state': 'done',
        }
        self.write(vals)
        self.order_id.state = 'refunded'
