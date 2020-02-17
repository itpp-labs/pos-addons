# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
import json
import logging

from odoo import api, fields, models

_logger = logging.getLogger(__name__)


class Micropay(models.Model):

    _name = "wechat.micropay"
    _order = "id desc"

    name = fields.Char("Name", readonly=True)
    order_ref = fields.Char("Order Reference", readonly=True)
    terminal_ref = fields.Char(
        "Terminal Reference", help="e.g. POS Name", readonly=True
    )
    total_fee = fields.Integer("Total Fee", help="Amount in cents", readonly=True)
    debug = fields.Boolean(
        "Sandbox",
        help="Payment was not made. It's only for testing purposes",
        readonly=True,
    )
    result_raw = fields.Text("Raw result", readonly=True)
    journal_id = fields.Many2one("account.journal")
    state = fields.Selection(
        [
            ("draft", "New"),
            ("done", "Paid"),
            ("error", "Error"),
            ("refunded", "Refunded (part of full amount)"),
        ],
        string="State",
        default="draft",
    )

    @api.model
    def _body(self, terminal_ref, **kwargs):
        return "%s - Products" % terminal_ref

    @api.model
    def create_from_qr(
        self,
        body,
        auth_code,
        pay_amount,
        terminal_ref=None,
        create_vals=None,
        order_ref=None,
        **kwargs
    ):
        """
        :param product_category: is used to prepare "body"
        :param pay_amount: Specifies the amount to pay. The units are in currency units (not cents)
        :param create_vals: extra args to pass on record creation
        """
        debug = self.env["ir.config_parameter"].get_param("wechat.local_sandbox") == "1"
        total_fee = int(100 * pay_amount)
        vals = {
            "journal_id": kwargs["journal_id"],
            "debug": debug,
            "terminal_ref": terminal_ref,
            "order_ref": order_ref,
            "total_fee": total_fee,
        }
        if create_vals:
            vals.update(create_vals)
        record = self.create(vals)

        if debug:
            _logger.info(
                "SANDBOX is activated. Request to wechat servers are not sending"
            )
            # Dummy Data. Change it to try different scenarios
            result_json = {
                "return_code": "SUCCESS",
                "result_code": "SUCCESS",
                "openid": "123",
                "total_fee": total_fee,
                "order_ref": order_ref,
            }
            if self.env.context.get("debug_micropay_response"):
                result_json = self.env.context.get("debug_micropay_response")
        else:
            wpay = self.env["ir.config_parameter"].get_wechat_pay_object()
            # TODO: we probably have make cr.commit() before making request to
            # be sure that we save data before sending request to avoid
            # situation when order is sent to wechat server, but was not saved
            # in our server for any reason

            result_json = wpay.micropay.create(
                body, total_fee, auth_code, out_trade_no=record.name
            )

        result_raw = json.dumps(result_json)
        _logger.debug("result_raw: %s", result_raw)
        vals = {"result_raw": result_raw, "state": "done"}
        record.write(vals)
        return record

    @api.model
    def create(self, vals):
        vals["name"] = self.env["ir.sequence"].next_by_code("wechat.micropay")
        return super(Micropay, self).create(vals)
