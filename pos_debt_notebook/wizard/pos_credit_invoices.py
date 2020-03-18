# -*- coding: utf-8 -*-
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import api, fields, models


class PosCreditInvoices(models.TransientModel):
    _name = "pos.credit.invoices"
    _description = "Write-off Credits"

    update_type = fields.Selection(
        [("balance_update", "Balance Update"), ("new_balance", "New Balance")],
        default="balance_update",
        required=True,
        string="Update Type",
        help="Make equal Invoices for partners or set them all the same credit value."
        " Applies only if partner amount will be decreased",
    )
    amount = fields.Float("Write-off Amount", default=0)
    new_balance = fields.Float("New Balance", default=0)

    journal_id = fields.Many2one(
        "account.journal",
        string="Journal",
        domain="[('debt', '=', True)]",
        required=True,
    )
    product_id = fields.Many2one(
        "product.product",
        "Credit Product",
        help="This product will be used on creating invoices.",
    )
    writeoff_method = fields.Selection(
        string="Write-off Method",
        required=True,
        selection=[("invoice", "Invoice"), ("mcu", "Manual Credit Update")],
        default="invoice",
        help='Otherwise it will be executed via "Manual Credit Updates"',
    )

    partner_ids = fields.Many2many("res.partner", string="Partners")
    partner_credits = fields.Float(
        "Total Partner Credit",
        compute="_compute_totals",
        help="Only credits are counted",
    )
    full_charge = fields.Float(
        string="Total Write-off Amount", compute="_compute_totals"
    )
    total_credit = fields.Float(
        "Total", compute="_compute_totals", help="Only credits are counted"
    )

    line_ids = fields.One2many("pos.credit.invoices.line", "wizard_id")

    @api.multi
    @api.onchange("journal_id")
    @api.depends("partner_ids", "journal_id")
    def _compute_totals(self):
        partners = self.partner_ids
        debts = partners._compute_partner_journal_debt(self.journal_id.id)

        self["partner_credits"] = sum([debts[p.id]["balance"] for p in partners] + [0])

        if self.update_type == "balance_update":
            self["full_charge"] = self.amount * len(partners)
        elif self.update_type == "new_balance":
            self["full_charge"] = sum(
                [
                    debts[p.id]["balance"] > self.new_balance
                    and debts[p.id]["balance"] - self.new_balance
                    or 0
                    for p in partners
                ]
                + [0]
            )
        self["total_credit"] = self["partner_credits"] - self["full_charge"]

    @api.onchange("amount", "update_type", "partner_ids", "journal_id")
    def update_lines(self):
        p2amount = None

        debts = self.partner_ids._compute_partner_journal_debt(self.journal_id.id)

        def p2balance(p):
            return debts[p.id]["balance"]

        if self.update_type == "balance_update":

            def p2amount(p):
                return self.amount

        elif self.update_type == "new_balance":

            def p2amount(p):
                return (
                    debts[p.id]["balance"] > self.new_balance
                    and debts[p.id]["balance"] - self.new_balance
                    or 0
                )

        self.line_ids = [
            # remove old lines
            (5, None, None)
        ] + [
            (
                0,
                None,
                {
                    "partner_id": p.id,
                    "amount": p2amount(p),
                    "current_balance": p2balance(p),
                },
            )
            for p in self.partner_ids
        ]

    @api.multi
    def apply(self):
        product = self.product_id
        account = (
            product.property_account_income_id
            or product.categ_id.property_account_income_categ_id
        )
        for line in self.line_ids:
            if not line.amount:
                continue
            if self.writeoff_method == "invoice":
                invoice = self.env["account.invoice"].create(
                    {
                        "type": "out_invoice",
                        "partner_id": line.partner_id.id,
                        "invoice_line_ids": [
                            (
                                0,
                                None,
                                {
                                    "product_id": product.id,
                                    "name": product.name,
                                    "price_unit": line.amount,
                                    "account_id": account.id,
                                },
                            )
                        ],
                    }
                )
                invoice.action_invoice_open()
                invoice.pay_and_reconcile(self.journal_id)
            else:
                vals = {
                    "partner_id": line.partner_id.id,
                    "journal_id": self.journal_id.id,
                    "update_type": self.update_type,
                }
                if self.update_type == "new_balance":
                    vals["new_balance"] = self.new_balance
                else:
                    vals["balance"] = -line.amount
                credit_update = self.env["pos.credit.update"].create(vals)
                credit_update.switch_to_confirm()

    @api.multi
    def add_partners_with_debt(self):
        if self.journal_id:
            partners = self.env["res.partner"].search([])
            partner_debts = partners._compute_partner_journal_debt(self.journal_id.id)
            partners_to_add = []
            for p in partners:
                if partner_debts[p.id]["balance"] > self.new_balance:
                    partners_to_add.append(p.id)
            if len(partners_to_add):
                self.write({"partner_ids": [(6, 0, partners_to_add)]})

            # it won't be done automatically
            self.update_lines()

            # prevents closing of the wizard
            return {"type": "ir.actions.do_nothing"}


class PosCreditInvoicesLine(models.TransientModel):
    _name = "pos.credit.invoices.line"
    _order = "partner_name"

    wizard_id = fields.Many2one("pos.credit.invoices")
    partner_name = fields.Char("Name", related="partner_id.name", readonly=True)

    partner_id = fields.Many2one("res.partner", "Partner", readonly=True)
    current_balance = fields.Float("Current Credits", readonly=True)

    amount = fields.Float("Write-off amount", readonly=True)
    total_balance = fields.Float(
        "Total Credits", compute="_compute_total_balance", readonly=True
    )

    @api.multi
    @api.depends("wizard_id", "amount", "partner_id")
    def _compute_total_balance(self):
        for rec in self:
            rec["total_balance"] = rec.current_balance - rec.amount
