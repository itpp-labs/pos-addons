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
    def pos_create_from_qr(self, **kwargs):
        body = self._body(kwargs['terminal_ref'])
        create_vals = {
            'pos_id': kwargs['pos_id'],
        }
        kwargs.update(create_vals=create_vals)
        odoo_async_call(self.create_from_qr,
                        self._send_pos_notification,
                        (body,),
                        kwargs)
        return 'ok'

    @api.model
    def _send_pos_notification(self, record):
        result_json = json.loads(record.result_raw)
        msg = {
            'event': 'payment_result',
            'result_code': result_json['result_code'],
        }
        self.env['pos.config']._send_to_channel_by_id(
            self._cr.dbname,
            record.pos_id.id,
            CHANNEL_MICROPAY,
            msg,
        )
