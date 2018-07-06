# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import logging
import json

from odoo import models, fields, api
from odoo.addons.wechat.tools import odoo_async_call

_logger = logging.getLogger(__name__)
CHANNEL_MICROPAY = 'micropay'


class Micropay(models.Model):

    _inherit = 'wechat.micropay'
    pos_id = fields.Many2one('pos.config')

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
        return self._process_pos_create_from_qr(record)

    @api.model
    def pos_create_from_qr(self, **kwargs):
        """Async method. Result is sent via longpolling"""
        args, kwargs = self._prepare_pos_create_from_qr(**kwargs)
        odoo_async_call(self.create_from_qr,
                        self._send_pos_notification,
                        args,
                        kwargs)
        return 'ok'

    @api.model
    def _process_pos_create_from_qr(self, record):
        result_json = json.loads(record.result_raw)
        msg = {
            'event': 'payment_result',
            'result_code': result_json['result_code'],
            'order_ref': record.order_ref,
            'total_fee': record.total_fee,
        }
        return msg

    @api.model
    def _send_pos_notification(self, record):
        msg = self._process_pos_create_from_qr(record)
        self.env['pos.config']._send_to_channel_by_id(
            self._cr.dbname,
            record.pos_id.id,
            CHANNEL_MICROPAY,
            msg,
        )
