# Copyright 2017 Artyom Losev
# Copyright 2018,2020 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).
import copy

from odoo import _, api, fields, models

SO_CHANNEL = "pos_sale_orders"
INV_CHANNEL = "pos_invoices"


class PosOrder(models.Model):
    _inherit = "pos.order"

    paid_invoice = fields.Boolean("Order Pays Invoice")

    @api.model
    def create_from_ui(self, pos_orders):
        orders = copy.deepcopy(pos_orders)
        invoices_to_pay = [o for o in orders if o.get("data").get("invoice_to_pay")]
        original_orders = [o for o in orders if o not in invoices_to_pay]
        res = super(PosOrder, self).create_from_ui(
            original_orders + self.update_orders_after_invoices(invoices_to_pay)
        )
        if invoices_to_pay:
            for inv in invoices_to_pay:
                self.process_invoice_payment(inv)
        return res

    def update_orders_after_invoices(self, orders):
        res = []
        PosSession = self.env["pos.session"]
        for order in orders:
            data = copy.deepcopy(order.get("data", {}))
            if not PosSession.browse(
                data["pos_session_id"]
            ).config_id.invoice_pos_order:
                continue
            invoice_data = data.get("invoice_to_pay")
            lines = invoice_data.get("lines")
            new_lines = []
            for l in lines:
                if l.get("display_type", False):
                    # means it's either note or section
                    continue
                l["price_subtotal"] = l.get("amount", 0) or l.get("subtotal", 0)
                l["price_subtotal_incl"] = l.get("total", 0) or l.get(
                    "price_subtotal", 0
                )
                if "invoice_id" in l:
                    del l["invoice_id"]
                new_lines.append([0, 0, l])
            invoice_data["lines"] = new_lines
            data.update({"amount_return": 0})
            data.update(invoice_data)
            name = data.get("origin", "") + " - " + data.get("number", "")
            qty = self.search_count([("pos_reference", "ilike", name)])
            data.update(
                {
                    "user_id": "user_id" in data and data["user_id"][0],
                    "partner_id": "partner_id" in data and data["partner_id"][0],
                    "name": data.get("origin", "")
                    + " - "
                    + data.get("number", "")
                    + " - "
                    + str(qty + 1),
                    "paid_invoice": True,
                }
            )
            if "invoice_id" in data:
                del data["invoice_id"]
            order["data"] = data
            res.append(order)
        return res

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res.update(
            {
                "paid_invoice": "paid_invoice" in ui_order and ui_order["paid_invoice"],
            }
        )
        return res

    @api.model
    def process_invoice_payment(self, invoice):
        for statement in invoice["data"]["statement_ids"]:
            inv_id = invoice["data"]["invoice_to_pay"]["id"]
            inv_obj = self.env["account.invoice"].browse(inv_id)
            journal_id = statement[2]["journal_id"]
            journal = self.env["account.journal"].browse(journal_id)
            amount = min(
                statement[2]["amount"],  # amount payed including change
                invoice["data"]["invoice_to_pay"]["residual"],  # amount required to pay
            )
            cashier = invoice["data"]["user_id"]
            writeoff_acc_id = False
            payment_difference_handling = "open"

            vals = {
                "journal_id": journal.id,
                "payment_method_id": 1,
                "payment_date": invoice["data"]["creation_date"],
                "communication": invoice["data"]["invoice_to_pay"]["number"],
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
        inv_id = order.action_invoice_create()
        self.env["account.invoice"].browse(inv_id).action_invoice_open()
        return inv_id

    def test_paid(self):
        for order in self:
            if not order.paid_invoice and not super(PosOrder, order).test_paid():
                return False
        return True


class AccountPayment(models.Model):
    _inherit = "account.payment"

    pos_session_id = fields.Many2one("pos.session", string="POS session")
    cashier = fields.Many2one("res.users")
    datetime = fields.Datetime(string="Datetime", default=fields.Datetime.now)


class AccountInvoice(models.Model):
    _inherit = "account.invoice"

    def action_updated_invoice(self):
        message = {"channel": INV_CHANNEL, "id": self.id}
        self.env["pos.config"].search([])._send_to_channel(INV_CHANNEL, message)

    @api.model
    def get_invoice_lines_for_pos(self, invoice_ids):
        res = []
        invoice_lines = self.env["account.invoice.line"].search(
            [("invoice_id", "in", invoice_ids)]
        )
        for l in invoice_lines:
            line = {
                "invoice_id": l.invoice_id.id,
                "id": l.id,
                "name": l.name,
                "account": l.account_id.name,
                "product": l.product_id.name,
                "price_unit": l.price_unit,
                "qty": l.quantity,
                "tax": l.invoice_line_tax_ids.mapped("name"),
                "tax_ids": [(4, t_id, None) for t_id in l.invoice_line_tax_ids.ids],
                "discount": l.discount,
                "amount": l.quantity * l.price_unit * (1 - (l.discount or 0.0) / 100.0),
                "total": l.price_subtotal,
                "product_id": l.product_id.id,
                "display_type": l.display_type,
            }
            res.append(line)
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
        for l in order_lines:
            line = {
                "order_id": l.order_id.id,
                "id": l.id,
                "name": l.name,
                "product": l.product_id.name,
                "product_id": l.product_id.id,
                "uom_qty": l.product_uom_qty,
                "qty_delivered": l.qty_delivered,
                "qty_invoiced": l.qty_invoiced,
                "tax": [tax.name or " " for tax in l.tax_id],
                "discount": l.discount,
                "subtotal": l.price_subtotal,
                "total": l.price_total,
                "invoiceble": (
                    (l.qty_delivered > 0) or (l.product_id.invoice_policy == "order")
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
    invoice_pos_order = fields.Boolean(
        string="Create POS Order after Invoices",
        help="When you pay an invoice via POS a pos order will be created",
        defaul=False,
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

    @api.multi
    def _compute_session_invoices_total(self):
        for rec in self:
            rec.session_invoices_total = sum(
                rec.session_payments.mapped("invoice_ids").mapped("amount_total") + [0]
            )

    @api.multi
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
            "res_model": "account.invoice",
            "view_type": "form",
            "view_mode": "tree,form",
        }
