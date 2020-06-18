# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
import json
import logging

from odoo import api, fields, models
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)

try:
    from alipay.exceptions import AliPayException
except ImportError as err:
    _logger.debug(err)


PAYMENT_RESULT_NOTIFICATION_URL = "alipay/callback"
SUCCESS = "SUCCESS"


class AlipayOrder(models.Model):
    """Records with order information and payment status.

    Can be used for different types of Payments. See description of trade_type field. """

    _name = "alipay.order"
    _description = "Unified Order"
    _order = "id desc"

    name = fields.Char("Name", readonly=True)
    order_ref = fields.Char("Order Reference", readonly=True)
    total_amount = fields.Float(
        "Total Amount", help="Amount in currency units (not cents)", readonly=True
    )
    discountable_amount = fields.Float(
        "Discountable Amount",
        help="Amount in currency units (not cents)",
        readonly=True,
    )
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
    line_ids = fields.One2many("alipay.order.line", "order_id")
    refund_ids = fields.One2many("alipay.refund", "order_id")

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

    def _total_amount(self):
        self.ensure_one()
        total_amount = sum([line.get_amount() for line in self.line_ids])
        return total_amount

    @api.model
    def _create_from_qr(
        self,
        auth_code,
        total_amount,
        journal_id,
        subject,
        terminal_ref=None,
        create_vals=None,
        order_ref=None,
        **kwargs
    ):
        """
        :param product_category: is used to prepare "body"
        :param total_amount: Specifies the amount to pay. The units are in currency units (not cents)
        :param create_vals: extra args to pass on record creation
        """
        debug = self.env["ir.config_parameter"].get_param("alipay.local_sandbox") == "1"
        total_amount = total_amount
        vals = {
            "journal_id": journal_id,
            "debug": debug,
            "terminal_ref": terminal_ref,
            "order_ref": order_ref,
            "total_amount": total_amount,
        }
        if create_vals:
            vals.update(create_vals)
        record = self.create(vals)

        if debug:
            _logger.info(
                "SANDBOX is activated. Request to apipay API servers are not sending"
            )
            # Dummy Data. Change it to try different scenarios
            # Doc: https://docs.open.alipay.com/140/104626
            result_json = {
                "code": "10003",
                "msg": "订单创建成功支付处理中",
                "trade_no": "2013112011001004330000121536",
                "out_trade_no": record.name,
                "buyer_user_id": "2088102122524333",
                "buyer_logon_id": "159****5620",
                "total_amount": "88.88",
            }
            if self.env.context.get("debug_alipay_response"):
                result_json = self.env.context.get("debug_alipay_response")
        else:
            alipay = self.env["ir.config_parameter"].get_alipay_object()
            # TODO: we probably have make cr.commit() before making request to
            # be sure that we save data before sending request to avoid
            # situation when order is sent to wechat server, but was not saved
            # in our server for any reason

            result_json = alipay.api_alipay_trade_pay(
                out_trade_no=record.name,
                scene="bar_code",
                auth_code=auth_code,
                subject=subject,
                total_amount=total_amount,
                discountable_amount=kwargs.get("discountable_amount"),
            )

        result_raw = json.dumps(result_json)
        _logger.debug("result_raw: %s", result_raw)
        # TODO state must depend on result_json['code']
        vals = {
            "result_raw": result_raw,
            "state": "done",
        }
        record.write(vals)
        return record

    @api.model
    def create_qr(self, lines, subject, **kwargs):
        try:
            order, code_url = self._create_qr(lines, subject, **kwargs)
        except AliPayException as e:
            return {
                "error": _("Error on sending request to Alipay: %s") % e.response.text
            }
        return {"code_url": code_url}

    @api.model
    def _create_qr(self, lines, subject, create_vals=None, total_amount=None, **kwargs):
        """Native Payment

        :param lines: list of dictionary
        :param total_amount: amount in currency (not cents)
        """
        debug = self.env["ir.config_parameter"].get_param("alipay.local_sandbox") == "1"
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
        total_amount = total_amount or order._total_amount()
        if debug:
            _logger.info(
                "SANDBOX is activated. Request to apipay API servers are not sending"
            )
            # Dummy Data. Change it to try different scenarios
            # Doc: https://docs.open.alipay.com/api_1/alipay.trade.precreate
            result_json = {
                "code": "10000",
                "msg": "Success",
                "out_trade_no": order.name,
                "qr_code": "https://qr.alipay.com/bavh4wjlxf12tper3a",
            }
            if self.env.context.get("debug_alipay_response"):
                result_json = self.env.context.get("debug_alipay_response")
        else:
            alipay = self.env["ir.config_parameter"].get_alipay_object()
            # TODO: we probably have make cr.commit() before making request to
            # be sure that we save data before sending request to avoid
            # situation when order is sent to wechat server, but was not saved
            # in our server for any reason

            result_json = alipay.api_alipay_trade_precreate(
                out_trade_no=order.name,
                subject=subject,
                total_amount=total_amount,
                discountable_amount=kwargs.get("discountable_amount"),
            )

        result_raw = json.dumps(result_json)
        _logger.debug("result_raw: %s", result_raw)
        vals = {
            "result_raw": result_raw,
            "total_amount": total_amount,
        }
        order.write(vals)
        code_url = result_json["qr_code"]
        return order, code_url

    def on_notification(self, data):
        """
        return updated record
        """
        # check signature
        wpay = self.env["ir.config_parameter"].get_alipay_pay_object()
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
        vals["name"] = self.env["ir.sequence"].next_by_code("alipay.order")
        return super(AlipayOrder, self).create(vals)


class AlipayOrderLine(models.Model):
    _name = "alipay.order.line"

    name = fields.Char("Name", help="When empty, product's name is used")
    description = fields.Char("Body")
    product_id = fields.Many2one("product.product", required=True)
    wxpay_goods_ID = fields.Char("Alipay Good ID")
    price = fields.Monetary(
        "Price", required=True, help="Price in currency units (not cents)"
    )
    currency_id = fields.Many2one("res.currency", related="order_id")
    quantity = fields.Integer(
        "Quantity", default=1, help="Quantity as Integer (Alipay limitation)"
    )
    quantity_full = fields.Char("Quantity Value", default="1")
    category = fields.Char("Category")
    order_id = fields.Many2one("alipay.order")

    def get_amount(self):
        self.ensure_one()
        return self.price or self.product_id.price
