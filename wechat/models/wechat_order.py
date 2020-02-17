# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
import json
import logging

from odoo import api, fields, models
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)

try:
    from wechatpy.exceptions import WeChatPayException
except ImportError as err:
    _logger.debug(err)


PAYMENT_RESULT_NOTIFICATION_URL = "wechat/callback"
SUCCESS = "SUCCESS"


class WeChatOrder(models.Model):
    """Records with order information and payment status.

    Can be used for different types of Payments. See description of trade_type field. """

    _name = "wechat.order"
    _description = "Unified Order"
    _order = "id desc"

    name = fields.Char("Name", readonly=True)
    trade_type = fields.Selection(
        [
            ("JSAPI", "Official Account Payment (Mini Program)"),
            ("NATIVE", "Native Payment"),
            ("APP", "In-App Payment"),
        ],
        help="""
* Official Account Payment -- Mini Program Payment or In-App Web-based Payment
* Native Payment -- Customer scans QR for specific order and confirm payment
* In-App Payment -- payments in native mobile applications
    """,
    )

    order_ref = fields.Char("Order Reference", readonly=True)
    total_fee = fields.Integer("Total Fee", help="Amount in cents", readonly=True)
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
    # terminal_ref = fields.Char('Terminal Reference', help='e.g. POS Name', readonly=True)
    debug = fields.Boolean(
        "Sandbox",
        help="Payment was not made. It's only for testing purposes",
        readonly=True,
    )
    order_details_raw = fields.Text("Raw Order", readonly=True)
    result_raw = fields.Text("Raw result", readonly=True)
    notification_result_raw = fields.Text("Raw Notification result", readonly=True)
    currency_id = fields.Many2one(
        "res.currency", default=lambda self: self.env.user.company_id.currency_id
    )
    notification_received = fields.Boolean(
        help="Set to true on receiving notifcation to avoid repeated processing",
        default=False,
    )
    journal_id = fields.Many2one("account.journal")
    refund_fee = fields.Integer("Refund Amount", compute="_compute_refund_fee")
    line_ids = fields.One2many("wechat.order.line", "order_id")
    refund_ids = fields.One2many("wechat.refund", "order_id")

    @api.depends("refund_ids.refund_fee", "refund_ids.state")
    def _compute_refund_fee(self):
        for r in self:
            r.refund_fee = sum(
                [ref.refund_fee for ref in r.refund_ids if ref.state == "done"]
            )

    def _body(self):
        """ Example of result:

        {"goods_detail": [
            {
                "goods_id": "iphone6s_16G",
                "wxpay_goods_id": "100 1",
                "goods_name": "iPhone 6s 16G",
                "goods_num": 1,
                "price": 100,
                "goods_category": "123456",
                "body": "苹果手机",
            },
            {
                "goods_id": "iphone6s_3 2G",
                "wxpay_goods_id": "100 2",
                "goods_name": "iPhone 6s 32G",
                "quantity": 1,
                "price": 200,
                "goods_category": "123789",
            }
        ]}"""
        self.ensure_one()
        rendered_lines = []
        order_body = []
        for line in self.line_ids:
            name = line.name or line.product_id.name
            body = name
            if line.quantity_full != "1":
                body = "{} {}".format(body, line.quantity_full)
            order_body.append(body)
            rline = {
                "goods_id": str(line.product_id.id),
                "goods_name": name,
                "goods_num": line.quantity,
                "price": line.get_fee(),
                "body": body,
            }
            if line.category:
                rline["category"] = line.category

            if line.wxpay_goods_ID:
                rline["wxpay_goods_id"] = line.wxpay_goods_id

            rendered_lines.append(rline)
        detail = {"goods_detail": rendered_lines}
        order_body = "; ".join(order_body)

        return order_body, detail

    def _total_fee(self):
        self.ensure_one()
        total_fee = sum([line.get_fee() for line in self.line_ids])
        return total_fee

    def _notify_url(self):
        url = (
            self.env["ir.config_parameter"]
            .sudo()
            .get_param("wechat.payment_result_notification_url")
        )
        if url:
            return url

        base = self.env["ir.config_parameter"].sudo().get_param("web.base.url")
        return "{base}/{path}".format(base=base, path=PAYMENT_RESULT_NOTIFICATION_URL)

    @api.model
    def create_qr(self, lines, **kwargs):
        try:
            order, code_url = self._create_qr(lines, **kwargs)
        except WeChatPayException as e:
            return {
                "error": _("Error on sending request to WeChat: %s") % e.response.text
            }
        return {"code_url": code_url}

    @api.model
    def _create_qr(self, lines, create_vals=None, pay_amount=None, **kwargs):
        """Native Payment

        :param lines: list of dictionary
        :param pay_amount: amount in currency (not cents)
        """
        debug = self.env["ir.config_parameter"].get_param("wechat.local_sandbox") == "1"
        vals = {
            "trade_type": "NATIVE",
            "line_ids": [(0, 0, data) for data in lines],
            "order_ref": kwargs.get("order_ref"),
            "journal_id": kwargs.get("journal_id"),
            "debug": debug,
        }
        if create_vals:
            vals.update(create_vals)
        order = self.create(vals)
        if pay_amount:
            # TODO: make a single method for this
            total_fee = int(100 * pay_amount)
        else:
            total_fee = order._total_fee()
        if debug:
            _logger.info(
                "SANDBOX is activated. Request to wechat servers is not sending"
            )
            # Dummy Data. Change it to try different scenarios
            result_json = {
                "return_code": "SUCCESS",
                "result_code": "SUCCESS",
                "openid": "123",
                "code_url": "weixin://wxpay/s/An4baqw",
            }
            if self.env.context.get("debug_wechat_order_response"):
                result_json = self.env.context.get("debug_wechat_order_response")
        else:
            body, detail = order._body()
            wpay = self.env["ir.config_parameter"].get_wechat_pay_object()
            # TODO: we probably have make cr.commit() before making request to
            # be sure that we save data before sending request to avoid
            # situation when order is sent to wechat server, but was not saved
            # in our server for any reason
            _logger.debug(
                "Unified order:\n total_fee: %s\n body: %s\n, detail: \n %s",
                total_fee,
                body,
                detail,
            )
            result_json = wpay.order.create(
                "NATIVE",
                body,
                total_fee,
                self._notify_url(),
                out_trade_no=order.name,
                detail=detail,
                # TODO fee_type=record.currency_id.name
            )

        result_raw = json.dumps(result_json)
        _logger.debug("result_raw: %s", result_raw)
        vals = {"result_raw": result_raw, "total_fee": total_fee}
        order.write(vals)
        code_url = result_json["code_url"]
        return order, code_url

    def on_notification(self, data):
        """
        return updated record
        """
        # check signature
        wpay = self.env["ir.config_parameter"].get_wechat_pay_object()
        if not wpay.check_signature(data):
            _logger.warning("Notification Signature is not valid:\n", data)
            return False

        order_name = data.get("out_trade_no")
        order = None
        if order_name:
            order = self.search([("name", "=", order_name)])
        if not order:
            _logger.warning("Order %s from notification is not found", order.id)
            return False

        # check for duplicates
        if order.notification_received:
            _logger.warning("Notifcation duplicate is received: %s", order)
            return None

        vals = {
            "notification_result_raw": json.dumps(data),
            "notification_received": True,
        }
        if not (data["return_code"] == SUCCESS and data["result_code"] == SUCCESS):
            vals["state"] = "error"

        else:
            vals["state"] = "done"

        order.write(vals)
        return order

    @api.model
    def create(self, vals):
        vals["name"] = self.env["ir.sequence"].next_by_code("wechat.order")
        return super(WeChatOrder, self).create(vals)


class WeChatOrderLine(models.Model):
    _name = "wechat.order.line"
    _description = "WeChat Order Line"

    name = fields.Char("Name", help="When empty, product's name is used")
    description = fields.Char("Body")
    product_id = fields.Many2one("product.product", required=True)
    wxpay_goods_ID = fields.Char("Wechat Good ID")
    price = fields.Monetary(
        "Price", required=True, help="Price in currency units (not cents)"
    )
    currency_id = fields.Many2one("res.currency", related="order_id", string="Currency")
    quantity = fields.Integer(
        "Quantity", default=1, help="Quantity as Integer (WeChat limitation)"
    )
    quantity_full = fields.Char("Quantity Value", default="1")
    category = fields.Char("Category")
    order_id = fields.Many2one("wechat.order", string="Order")

    def get_fee(self):
        self.ensure_one()
        return int(100 * (self.price or self.product_id.price))
