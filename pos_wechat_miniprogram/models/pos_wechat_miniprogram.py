# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

CHANNEL_NAME = "pos.wechat.miniprogram"


class PosWeChatMiniProgramOrder(models.Model):
    """Records with order information and payment status from WeChat mini-program.

    Can be used for sync between mini-programs. """

    _name = "pos.miniprogram.order"
    _description = "Orders from WeChat mini-program"
    _order = "id desc"
    _rec_name = "date_order"

    name = fields.Char("Name", readonly=True, copy=False)
    company_id = fields.Many2one(
        "res.company",
        string="Company",
        required=True,
        readonly=True,
        default=lambda self: self.env.user.company_id,
    )
    multi_session_id = fields.Many2one("pos.multi_session", "Multi-session")
    date_order = fields.Datetime(
        string="Order Date", readonly=True, index=True, default=fields.Datetime.now
    )
    partner_id = fields.Many2one(
        "res.partner",
        string="Customer",
        index=True,
        states={"draft": [("readonly", False)]},
    )
    amount_total = fields.Float(compute="_compute_amount_all", string="Total", digits=0)
    lines_ids = fields.One2many(
        "pos.miniprogram.order.line",
        "order_id",
        string="Order Lines",
        readonly=True,
        copy=True,
    )
    order_id = fields.Many2one("pos.order", string="Point of Sale")
    order_ref = fields.Char("Order Reference", readonly=True)
    wechat_order_id = fields.Many2one("wechat.order", string="WeChar Order")
    state = fields.Selection(
        [
            ("draft", "Unpaid"),
            ("done", "Paid"),
            ("error", "Error"),
            ("refunded", "Refunded (part of full amount)"),
        ],
        string="State",
        default="draft",
    )
    note = fields.Text(string="Order Notes")
    table_id = fields.Many2one(
        "restaurant.table", string="Table", help="The table where this order was served"
    )
    floor_id = fields.Many2one("restaurant.floor", string="Floor")
    customer_count = fields.Integer(
        string="Guests",
        help="The amount of customers that have been served by this order.",
    )
    payment_method = fields.Selection(
        [
            ("instant_payment", "Instant Payment from Mini-Program"),
            ("deffered_payment", "Deffered Payment from POS"),
        ],
        string="Payment Method",
        default="instant_payment",
    )
    to_invoice = fields.Boolean(string="Invoice", default=False)
    confirmed_from_pos = fields.Boolean(
        string="Order Confirmed from POS", default=False
    )
    user_id = fields.Many2one(related="order_id.user_id", store=True)
    packing_methods = fields.Selection(
        [("take_away", "Take Away"), ("eat_in", "Eat In")], string="Packing method"
    )

    @api.depends("lines_ids.amount_total", "lines_ids.discount")
    def _compute_amount_all(self):
        for order in self:
            order.amount_total = sum(line.amount_total for line in order.lines_ids)

    @api.model
    def create_from_miniprogram_ui(self, lines, create_vals):
        """
        Create order from mini-program and send the order to POS

        :param lines: orderlines from mini-program
        :param create_vals: additional information about order
        """
        _logger.debug(
            "Create Order from WeChat mini-program: lines - %s, create values - %s",
            lines,
            create_vals,
        )

        if self.env.user.number_verified is False:
            raise UserError(
                _("Mobile phone number not specified for User: %s (id: %s)")
                % (self.env.user.name, self.env.user.id)
            )
        vals = {"lines_ids": [(0, 0, data) for data in lines]}

        create_vals["partner_id"] = self.env.user.partner_id.id

        if create_vals:
            vals.update(create_vals)

        order = self.sudo().create(vals)

        _logger.debug("Mini-program Order: %s", order)
        _logger.debug("Order Pay method: %s", order.payment_method)

        if order.payment_method == "instant_payment":
            create_vals["miniprogram_order_ids"] = [(4, order.id)]
            return self.env["wechat.order"].create_jsapi_order(lines, create_vals)

        order._send_message_to_pos()
        return order._prepare_mp_message()

    @api.multi
    def _update_order_state(self):
        self.ensure_one()
        self.write({"state": self.wechat_order_id.state})

    @api.multi
    def on_notification_wechat_order(self):
        for r in self:
            r._update_order_state()
            if r.state == "done":
                r._send_message_to_pos()

    @api.multi
    def _prepare_mp_message(self):
        """
        To prepare the message of mini-program
        """
        self.ensure_one()
        res = self.read()[0]
        res["lines_ids"] = self.lines_ids.read()
        _logger.debug("Read order and orderline: %s", res)
        return res

    @api.multi
    def _send_message_to_pos(self):
        self.ensure_one()
        message = self._prepare_mp_message()
        for pos in self.env["pos.config"].search(
            [
                ("allow_message_from_miniprogram", "=", True),
                ("multi_session_id", "=", self.multi_session_id.id),
                ("company_id", "=", self.company_id.id),
            ]
        ):
            _logger.debug(
                "SEND MESSAGE: %s, FOR POS: %s, CHANNEL: %s",
                message,
                pos.id,
                CHANNEL_NAME,
            )
            self.env["pos.config"]._send_to_channel_by_id(
                self._cr.dbname, pos.id, CHANNEL_NAME, message
            )

    @api.model
    def add_orderline(self, vals):
        line = self.env["pos.miniprogram.order.line"].create(vals)
        # TODO: send the line to other mini-programs
        return line

    @api.model
    def remove_orderline(self, res_id):
        line = self.env["pos.miniprogram.order.line"].browse(res_id)
        # TODO: send remove information about the line to other mini-programs
        return line.unlink()

    @api.model
    def change_orderline(self, res_id, vals):
        line = self.env["pos.miniprogram.order.line"].browse(res_id)
        # TODO: send update information about the line to other mini-programs
        return line.write(vals)


class PosWeChatMiniProgramOrderLine(models.Model):
    _name = "pos.miniprogram.order.line"
    _description = "Lines of WeChat mini-programs Orders"
    _rec_name = "product_id"

    name = fields.Char(string="Name", readonly=True, copy=False)
    product_id = fields.Many2one(
        "product.product",
        string="Product",
        domain=[("sale_ok", "=", True)],
        required=True,
        change_default=True,
    )
    price = fields.Float(
        "Price", required=True, help="Price in currency units (not cents)"
    )
    quantity = fields.Float("Quantity", default=1)
    order_id = fields.Many2one(
        "pos.miniprogram.order", string="WeChat mini-program Order"
    )
    discount = fields.Float(string="Discount (%)", digits=0, default=0.0)
    create_date = fields.Datetime(string="Creation Date", readonly=True)
    amount_total = fields.Float(compute="_compute_amount_all", string="Total", digits=0)
    note = fields.Text(string="Note")
    confirmed_from_pos = fields.Boolean(
        related="order_id.confirmed_from_pos", readonly=True
    )
    company_id = fields.Many2one(
        "res.company", related="order_id.company_id", readonly=True
    )

    @api.depends("price", "quantity", "discount", "product_id")
    def _compute_amount_all(self):
        for line in self:
            price = line.price * (1 - (line.discount or 0.0) / 100.0)
            amount_total = price * line.quantity
            line.update({"amount_total": amount_total})
