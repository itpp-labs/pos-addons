# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import json

from odoo import models, api
from odoo.addons.qr_payments.tools import odoo_async_call

_logger = logging.getLogger(__name__)


class Micropay(models.Model):

    _inherit = ['wechat.pos', 'wechat.micropay']
    _name = 'wechat.micropay'

    @api.model
    def _prepare_pos_create_from_qr(self, **kwargs):
        body = self._body(kwargs['terminal_ref'])
        create_vals = {
            'pos_id': kwargs['pos_id'],
        }
        kwargs.update(create_vals=create_vals)
        args = (body,)
        return args, kwargs

    @api.model
    def pos_create_from_qr_sync(self, **kwargs):
        args, kwargs = self._prepare_pos_create_from_qr(**kwargs)
        record = self.create_from_qr(*args, **kwargs)
        return record._prepare_message()

    @api.model
    def pos_create_from_qr(self, **kwargs):
        """Async method. Result is sent via longpolling"""
        args, kwargs = self._prepare_pos_create_from_qr(**kwargs)
        odoo_async_call(self.create_from_qr, args, kwargs,
                        callback=self._on_micropay)
        return 'ok'

    @api.model
    def _on_micropay(self, record):
        record._send_pos_notification()

    @api.multi
    def _prepare_message(self):
        self.ensure_one()
        result_json = json.loads(self.result_raw)
        msg = {
            'event': 'payment_result',
            'result_code': result_json['result_code'],
            'order_ref': self.order_ref,
            'total_fee': self.total_fee,
            'journal_id': self.journal_id.id,
        }
        return msg
