# Copyright 2017 Artyom Losev
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import _, api, fields, models

SO_CHANNEL = "pos_sale_orders"
INV_CHANNEL = "pos_invoices"


class PosOrder(models.Model):
    _inherit = "pos.order"

    @api.model
    def create_from_ui(self, orders, draft=False):
        invoices_to_pay = [o for o in orders if o.get("data").get("invoice_to_pay")]
        original_orders = [o for o in orders if o not in invoices_to_pay]
        res = super(PosOrder, self).create_from_ui(original_orders, draft=draft)
        if invoices_to_pay:
            for inv in invoices_to_pay:
                self.process_invoice_payment(inv)
        return res

    @api.model
    def process_invoice_payment(self, invoice):
        for statement in invoice["data"]["statement_ids"]:
            inv_id = invoice["data"]["invoice_to_pay"]["id"]
            inv_obj = self.env["account.move"].browse(inv_id)
            payment_method_id = statement[2]["payment_method_id"]
            journal = self.env["pos.payment.method"].browse(payment_method_id)
            amount = min(
                statement[2]["amount"],  # amount payed including change
                invoice["data"]["invoice_to_pay"][
                    "amount_residual"
                ],  # amount required to pay
            )
            cashier = invoice["data"]["user_id"]
            writeoff_acc_id = False
            payment_difference_handling = "open"

            vals = {
                "journal_id": journal.id,
                "payment_method_id": 1,
                "payment_date": invoice["data"]["creation_date"],
                # "communication": invoice["data"]["invoice_to_pay"]["number"],
                "invoice_ids": [(4, inv_id, None)],
                "payment_type": "inbound",
                "amount": amount,
                "currency_id": inv_obj.currency_id.id,
                "partner_id": invoice["data"]["invoice_to_pay"]["partner_id"][0],
                "partner_type": "customer",
                "payment_difference_handling": payment_difference_handling,
                "writeoff_account_id": writeoff_acc_id,
                "pos_session_id": invoice["data"]["pos_session_id"],
                "cashier": cashier,
            }
            payment = self.env["account.payment"].create(vals)
            payment.post()

    @api.model
    def process_invoices_creation(self, sale_order_id):
        order = self.env["sale.order"].browse(sale_order_id)
        inv_id = order._create_invoices(final=True)
        inv_id.action_post()
        return inv_id.id


class AccountPayment(models.Model):
    _inherit = "account.payment"

    pos_session_id = fields.Many2one("pos.session", string="POS session")
    cashier = fields.Many2one("res.users")
    datetime = fields.Datetime(string="Datetime", default=fields.Datetime.now)


class AccountInvoice(models.Model):
    _inherit = "account.move"

    def action_updated_invoice(self):
        message = {"channel": INV_CHANNEL, "id": self.id}
        self.env["pos.config"].search([])._send_to_channel(INV_CHANNEL, message)

    @api.model
    def get_invoice_lines_for_pos(self, move_ids):
        res = self.env["account.move.line"].search_read(
            [("mode_id", "in", move_ids)],
            [
                "id",
                "move_id",
                "name",
                "account",
                "product",
                "price_unit",
                "qty",
                "tax",
                "discount",
                "amount",
            ],
        )
        return res

    @api.depends("payment_move_line_ids.amount_residual")
    def _get_payment_info_JSON(self):
        for record in self:
            if not record.payment_move_line_ids:
                pass
            for move in record.payment_move_line_ids:
                if move.payment_id.cashier:
                    if move.move_id.ref:
                        move.move_id.ref = "{} by {}".format(
                            move.move_id.ref, move.payment_id.cashier.name
                        )
                    else:
                        move.move_id.name = "{} by {}".format(
                            move.move_id.name, move.payment_id.cashier.name
                        )
        data = super(AccountInvoice, self)._get_payment_info_JSON()
        return data


class SaleOrder(models.Model):
    _inherit = "sale.order"

    def action_updated_sale_order(self):
        message = {"channel": SO_CHANNEL, "id": self.id}
        self.env["pos.config"].search([])._send_to_channel(SO_CHANNEL, message)

    @api.model
    def get_order_lines_for_pos(self, sale_order_ids):
        res = []
        order_lines = self.env["sale.order.line"].search(
            [("order_id", "in", sale_order_ids)]
        )
        for i in order_lines:
            line = {
                "order_id": i.order_id.id,
                "id": i.id,
                "name": i.name,
                "product": i.product_id.name,
                "uom_qty": i.product_uom_qty,
                "qty_delivered": i.qty_delivered,
                "qty_invoiced": i.qty_invoiced,
                "tax": [tax.name or " " for tax in i.tax_id],
                "discount": i.discount,
                "subtotal": i.price_subtotal,
                "total": i.price_total,
                "invoiceble": (
                    (i.qty_delivered > 0) or (i.product_id.invoice_policy == "order")
                ),
            }
            res.append(line)
        return res


class PosConfig(models.Model):
    _inherit = "pos.config"

    def _get_default_writeoff_account(self):
        acc = self.env["account.account"].search([("code", "=", 220000)]).id
        return acc if acc else False

    show_invoices = fields.Boolean(help="Show invoices in POS", default=True)
    show_sale_orders = fields.Boolean(help="Show sale orders in POS", default=True)
    pos_invoice_pay_writeoff_account_id = fields.Many2one(
        "account.account",
        string="Difference Account",
        help="The account is used for the difference between due and paid amount",
        default=_get_default_writeoff_account,
    )
    invoice_cashier_selection = fields.Boolean(
        string="Select Invoice Cashier",
        help="Ask for a cashier when fetch invoices",
        defaul=True,
    )
    sale_order_cashier_selection = fields.Boolean(
        string="Select Sale Order Cashier",
        help="Ask for a cashier when fetch orders",
        defaul=True,
    )


class PosSession(models.Model):
    _inherit = "pos.session"

    session_payments = fields.One2many(
        "account.payment",
        "pos_session_id",
        string="Invoice Payments",
        help="Show invoices paid in the Session",
    )
    session_invoices_total = fields.Float(
        "Invoices", compute="_compute_session_invoices_total"
    )

    def _compute_session_invoices_total(self):
        for rec in self:
            rec.session_invoices_total = sum(
                rec.session_payments.mapped("invoice_ids").mapped("amount_total") + [0]
            )

    def action_invoice_payments(self):
        payments = self.env["account.payment"].search(
            [("pos_session_id", "in", self.ids)]
        )
        invoices = payments.mapped("invoice_ids").ids
        domain = [("id", "in", invoices)]
        return {
            "name": _("Invoice Payments"),
            "type": "ir.actions.act_window",
            "domain": domain,
            "res_model": "account.move",
            "view_type": "form",
            "view_mode": "tree,form",
        }
