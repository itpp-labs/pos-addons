# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
import json

from odoo import api, models

from odoo.addons.qr_payments.tools import odoo_async_call


class AlipayOrder(models.Model):
    _inherit = ["alipay.order", "alipay.pos"]
    _name = "alipay.order"

    @api.multi
    def _prepare_message(self):
        self.ensure_one()
        result_json = json.loads(self.result_raw)
        msg = {
            "event": "payment_result",
            "code": result_json["code"],
            "order_ref": self.order_ref,
            "total_amount": self.total_amount,
            "journal_id": self.journal_id.id,
        }
        return msg

    def on_notification(self, data):
        order = super(AlipayOrder, self).on_notification(data)
        if order and order.pos_id:
            order._send_pos_notification()
        return order

    @api.model
    def create_qr(self, lines, **kwargs):
        pos_id = kwargs.get("pos_id")
        if pos_id:
            if "create_vals" not in kwargs:
                kwargs["create_vals"] = {}
            kwargs["create_vals"]["pos_id"] = pos_id
        return super(AlipayOrder, self).create_qr(lines, **kwargs)

    @api.model
    def _prepare_pos_create_from_qr(self, **kwargs):
        create_vals = {
            "pos_id": kwargs["pos_id"],
        }
        kwargs.update(create_vals=create_vals)
        args = ()
        return args, kwargs

    @api.model
    def pos_create_from_qr_sync(self, **kwargs):
        args, kwargs = self._prepare_pos_create_from_qr(**kwargs)
        record = self._create_from_qr(*args, **kwargs)
        return record._prepare_message()

    @api.model
    def pos_create_from_qr(self, **kwargs):
        """Async method. Result is sent via longpolling"""
        args, kwargs = self._prepare_pos_create_from_qr(**kwargs)
        odoo_async_call(
            self._create_from_qr,
            args,
            kwargs,
            callback=self._send_pos_notification_callback,
        )
        return "ok"

    @api.model
    def _send_pos_notification_callback(self, record):
        record._send_pos_notification()
