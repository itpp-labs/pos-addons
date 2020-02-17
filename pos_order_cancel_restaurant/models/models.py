# -*- coding: utf-8 -*-
# Copyright 2017-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    kitchen_canceled_only = fields.Boolean(
        string="Ask reason for kitchen orders only",
        default=False,
        help="Ask cancelation / refund reason for orders sent (printed) to kitchen only",
    )
    auto_send_to_kitchen = fields.Boolean(
        string="Automatic Order Sending",
        help="Send order to the kitchen immediately after cancelation / refund the orderline (if the line was sent before)",
        default=False,
    )
    save_canceled_kitchen_orders_only = fields.Boolean(
        string="Save Canceled / Refunded kitchen orders only",
        default=False,
        help="Save canceled / refunded orders in Backend",
    )
    send_removed_lines_to_kitchen = fields.Boolean(
        string="Send removed line to Kitchen",
        default=True,
        help="If unchecked, the orderline will not be printed repeatly after its removing",
    )
    ask_managers_pin_kitchen_orders_only = fields.Boolean(
        string="Ask Manager For Kitchen orders only",
        default=False,
        help="Only Managers are allowed to cancel kitchen order lines",
    )


class PosOrderLineCanceled(models.Model):
    _inherit = "pos.order.line.canceled"

    was_printed = fields.Boolean(
        "Printed",
        default=False,
        readonly=True,
        help="Product was printed at kitchen printer. Usually it means, that product was canceled after being cooked.",
    )


class PosOrder(models.Model):
    _inherit = "pos.order"
    save_canceled_kitchen_orders_only = fields.Boolean(
        related="config_id.save_canceled_kitchen_orders_only", store=True
    )
