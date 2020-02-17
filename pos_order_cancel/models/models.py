# -*- coding: utf-8 -*-
# Copyright 2017 gaelTorrecillas <https://github.com/gaelTorrecillas>
# Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from datetime import datetime
from functools import partial

import pytz

from odoo import api, fields, models


class PosCancelledReason(models.Model):
    _name = "pos.cancelled_reason"

    sequence = fields.Integer(string="Sequence")
    name = fields.Char(string="Reason", translate=True)
    canceled_line_ids = fields.Many2many(
        "pos.order.line.canceled",
        "reason_cancelled_line_rel",
        "cancelled_reason_id",
        "canceled_line_id",
    )


class PosOrder(models.Model):
    _inherit = "pos.order"

    cancellation_reason = fields.Text(string="Reasons as Text")
    is_cancelled = fields.Boolean("Stage Cancelled", default=False)
    canceled_lines = fields.One2many(
        "pos.order.line.canceled", "order_id", string="Canceled Lines"
    )
    computed_state = fields.Selection(
        [
            ("draft", "New"),
            ("cancel", "Cancelled"),
            ("paid", "Paid"),
            ("done", "Posted"),
            ("invoiced", "Invoiced"),
        ],
        "Status",
        compute="_compute_state",
    )

    cancelled_amount_tax = fields.Float(
        compute="_compute_cancelled_amount_all", string="Taxes", digits=0
    )
    cancelled_amount_total = fields.Float(
        compute="_compute_cancelled_amount_all", string="Total", digits=0, default=0
    )

    @api.depends(
        "canceled_lines",
        "canceled_lines.price_subtotal_incl",
        "canceled_lines.discount",
    )
    def _compute_cancelled_amount_all(self):
        for order in self:
            order.cancelled_amount_total = order.cancelled_amount_tax = 0.0
            currency = order.pricelist_id.currency_id
            order.cancelled_amount_tax = currency.round(
                sum(
                    self._amount_line_tax(line, order.fiscal_position_id)
                    for line in order.canceled_lines
                )
            )
            amount_untaxed = currency.round(
                sum(line.price_subtotal for line in order.canceled_lines)
            )
            order.cancelled_amount_total = order.cancelled_amount_tax + amount_untaxed

    @api.depends("is_cancelled", "state")
    def _compute_state(self):
        for pos_order in self:
            if pos_order.is_cancelled and (
                pos_order.state == "paid" or pos_order.state == "done"
            ):
                if pos_order.computed_state != "Cancelled":
                    pos_order.computed_state = "cancel"
            else:
                pos_order.computed_state = pos_order.state

    @api.model
    def _order_fields(self, ui_order):
        order = super(PosOrder, self)._order_fields(ui_order)
        process_canceled_line = partial(
            self.env["pos.order.line.canceled"]._order_cancel_line_fields
        )
        order["canceled_lines"] = [
            process_canceled_line(l) for l in ui_order.get("canceled_lines", [])
        ]
        return order

    @api.model
    def _process_order(self, pos_order):
        order = super(PosOrder, self)._process_order(pos_order)
        if "is_cancelled" in pos_order and pos_order["is_cancelled"] is True:
            if pos_order["reason"]:
                order.cancellation_reason = (
                    pos_order["reason"].encode("utf-8").strip(" \t\n")
                )
            order.is_cancelled = True
        return order

    def _create_account_move_line(self, session=None, move=None):
        uncanceled_order = self.filtered(lambda o: not o.is_cancelled)
        return super(PosOrder, uncanceled_order)._create_account_move_line(
            session, move
        )

    @api.multi
    def action_pos_order_paid(self):
        if not self.is_cancelled:
            return super(PosOrder, self).action_pos_order_paid()
        else:
            self.write({"state": "paid"})
            return True

    @api.multi
    def action_pos_order_done(self):
        if self.is_cancelled:
            self.write({"state": "done"})
            return True
        else:
            return super(PosOrder, self).action_pos_order_done()

    def _reconcile_payments(self):
        uncanceled_order = self.filtered(lambda o: not o.is_cancelled)
        super(PosOrder, uncanceled_order)._reconcile_payments()


class PosOrderLineCanceled(models.Model):
    _name = "pos.order.line.canceled"
    _rec_name = "product_id"

    def _order_cancel_line_fields(self, line):
        if line and "tax_ids" not in line[2]:
            product = self.env["product.product"].browse(line[2]["product_id"])
            line[2]["tax_ids"] = [(6, 0, [x.id for x in product.taxes_id])]
        return line

    product_id = fields.Many2one(
        "product.product",
        string="Product",
        domain=[("sale_ok", "=", True)],
        required=True,
        change_default=True,
        readonly=True,
    )
    discount = fields.Float(string="Discount (%)", digits=0, default=0.0, readonly=True)
    price_unit = fields.Float(string="Unit Price", digits=0, readonly=True)
    user_id = fields.Many2one(
        comodel_name="res.users",
        string="Salesman",
        help="Person who removed order line",
        default=lambda self: self.env.uid,
        readonly=True,
    )
    qty = fields.Float("Cancelled Quantity", default=1, readonly=True)
    current_qty = fields.Float("Remainder", default=0, readonly=True)
    reason = fields.Text(
        string="Reasons as Text", help="The Reason of Line Canceled", readonly=True
    )
    order_id = fields.Many2one(
        "pos.order", string="Order Ref", ondelete="cascade", readonly=True
    )
    pack_lot_ids = fields.One2many(
        "pos.pack.operation.lot",
        "pos_order_line_id",
        string="Lot/serial Number",
        readonly=True,
    )
    tax_ids = fields.Many2many("account.tax", string="Taxes", readonly=True)
    canceled_date = fields.Datetime(
        string="Cancelation Time", readonly=True, default=fields.Datetime.now
    )
    price_subtotal = fields.Float(
        compute="_compute_amount_line_all",
        digits=0,
        string="Subtotal w/o Tax",
        store=True,
    )
    price_subtotal_incl = fields.Float(
        compute="_compute_amount_line_all", digits=0, string="Subtotal", store=True
    )
    cancelled_reason_ids = fields.Many2many(
        "pos.cancelled_reason",
        "reason_cancelled_lines_rel",
        "canceled_line_id",
        "cancelled_reason_id",
        string="Predefined Reasons",
    )

    # the absolute_discount field is needed for compatibility
    # with <https://www.odoo.com/apps/modules/10.0/pos_orderline_absolute_discount/> module
    absolute_discount = fields.Float(
        string="Discount (abs)", digits=0, default=0.0, readonly=True
    )

    @api.depends("price_unit", "tax_ids", "qty", "discount", "product_id")
    def _compute_amount_line_all(self):
        for line in self:
            currency = line.order_id.pricelist_id.currency_id
            taxes = line.tax_ids.filtered(
                lambda tax: tax.company_id.id == line.order_id.company_id.id
            )
            fiscal_position_id = line.order_id.fiscal_position_id
            if fiscal_position_id:
                taxes = fiscal_position_id.map_tax(
                    taxes, line.product_id, line.order_id.partner_id
                )
            price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
            line.price_subtotal = line.price_subtotal_incl = price * line.qty
            if taxes:
                taxes = taxes.compute_all(
                    price,
                    currency,
                    line.qty,
                    product=line.product_id,
                    partner=line.order_id.partner_id or False,
                )
                line.price_subtotal = taxes["total_excluded"]
                line.price_subtotal_incl = taxes["total_included"]

            line.price_subtotal = currency.round(line.price_subtotal)
            line.price_subtotal_incl = currency.round(line.price_subtotal_incl)

    @api.model
    def create(self, values):
        if values.get("canceled_date"):
            canceled_date = datetime.strptime(
                values.get("canceled_date"), "%d/%m/%Y %H:%M:%S"
            )
            tz = pytz.timezone(self.env.user.tz) if self.env.user.tz else pytz.utc
            canceled_date = tz.localize(canceled_date)
            canceled_date = canceled_date.astimezone(pytz.utc)
            canceled_date = fields.Datetime.to_string(canceled_date)
            values["canceled_date"] = canceled_date
        if (
            values.get("cancelled_reason_ids")
            and len(values.get("cancelled_reason_ids")) > 0
        ):
            values["cancelled_reason_ids"] = [
                (4, id) for id in values.get("cancelled_reason_ids")
            ]
        return super(PosOrderLineCanceled, self).create(values)


class PosConfig(models.Model):
    _inherit = "pos.config"

    allow_custom_reason = fields.Boolean(
        string="Allow custom cancellation reason",
        help="When not active, user will be able to select predefined reasons only",
        default=True,
    )
    allow_cancel_deletion = fields.Boolean(
        string="Cancel the deletion",
        help="When not active, a user will have to select predefined reasons without the possibility to cancel this action",
        default=True,
    )
    show_popup_change_quantity = fields.Boolean(
        string="Specify Quantity to Cancel",
        help="Allow to specify a quantity for products to cancel",
    )
    show_cancel_info = fields.Boolean(
        string="Display the Cancellation Information",
        default=False,
        help="Display the information of canceled products in order in POS (format: Qty - User - Table)",
    )
    ask_managers_pin = fields.Boolean(
        string="Ask Manager",
        default=False,
        help="Only Managers are allowed to cancel lines",
    )
