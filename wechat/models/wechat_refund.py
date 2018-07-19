f# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
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
    trade_type = fields.Selection([
        ('JSAPI', 'Official Account Payment (Mini Program)'),
        ('NATIVE', 'Native Payment'),
        ('APP', 'In-App Payment'),
    ], help="""
* Official Account Payment -- Mini Program Payment or In-App Web-based Payment
* Native Payment -- Customer scans QR for specific refund and confirm payment
* In-App Payment -- payments in native mobile applications
    """)

    refund_ref = fields.Char('Refund Reference', readonly=True)
    total_fee = fields.Integer('Total Fee', help='Amount in cents', readonly=True)
    state = fields.Selection([
        ('draft', 'Unpaid'),
        ('done', 'Paid'),
        ('error', 'Error'),
    ], string='State', default='draft')
    # terminal_ref = fields.Char('Terminal Reference', help='e.g. POS Name', readonly=True)
    debug = fields.Boolean('Sandbox', help="Payment was not made. It's only for testing purposes", readonly=True)
    refund_details_raw = fields.Text('Raw Refund', readonly=True)
    result_raw = fields.Text('Raw result', readonly=True)
    notification_result_raw = fields.Text('Raw Notification result', readonly=True)
    currency_id = fields.Many2one('res.currency', default=lambda self: self.env.user.company_id.currency_id)
    notification_received = fields.Boolean(help='Set to true on receiving notifcation to avoid repeated processing', default=False)
    journal_id = fields.Many2one('account.journal')

    @api.model
    def create(self, vals):
        vals['name'] = self.env['ir.sequence'].next_by_code('wechat.refund')
        return super(WeChatRefund, self).create(vals)
