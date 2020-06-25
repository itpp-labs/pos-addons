# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import fields, models

CHANNEL_NAME = "pos.wechat.miniprogram"


class WeChatOrder(models.Model):
    _inherit = "wechat.order"

    miniprogram_order_ids = fields.One2many(
        "pos.miniprogram.order",
        "wechat_order_id",
        string="Order from mini-program",
        readonly=True,
        copy=False,
    )

    def on_notification(self, data):
        order = super(WeChatOrder, self).on_notification(data)
        if order and order.miniprogram_order_ids:
            order.miniprogram_order_ids.on_notification_wechat_order()
        return order
