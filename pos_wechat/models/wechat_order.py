# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
import json
from odoo import models, api


class WeChatOrder(models.Model):
    _inherit = ['wechat.order', 'wechat.pos']
    _name = 'wechat.order'

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

    def on_notification(self, data):
        order = super(WeChatOrder, self).on_notification(data)
        if order:
            order._send_pos_notification()
        return order
