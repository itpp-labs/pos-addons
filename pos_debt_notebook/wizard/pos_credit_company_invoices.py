# -*- coding: utf-8 -*-
# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import api, fields, models


class PosCreditInvoices(models.TransientModel):
    _name = "pos.credit.invoices.company"
    _description = "Generate invoices to pay Pos Credits"

    partner_id = fields.Many2one(
        "res.partner", "Company", domain="[('is_company', '=', True)]", required=True
    )
    product_id = fields.Many2one(
        "product.product",
        "Credit Product",
        domain="[('credit_product', '!=', False)]",
        required="True",
        help="This product will be used on creating invoices.",
    )
    credit_balance_company = fields.Float(related="partner_id.credit_balance_company")
    amount = fields.Float("Amount")
    payment_type = fields.Selection(
        [
            ("pay_debts", "Pay debts only"),
            ("pay_per_employee", "Pay same amount for each employee"),
            ("custom", "Custom amount per each employee"),
        ],
        default="custom",
        required=True,
    )
    line_ids = fields.One2many("pos.credit.invoices.company.line", "wizard_id")
    total = fields.Float("Total to pay", compute="_compute_total")

    @api.onchange("partner_id", "amount", "payment_type")
    def update_lines(self):
        p2amount = None
        if self.payment_type == "custom":

            def p2amount(p):
                return 0

        elif self.payment_type == "pay_debts":

            def p2amount(p):
                return p.debt

        elif self.payment_type == "pay_per_employee":

            def p2amount(p):
                return self.amount

        self.line_ids = [
            # remove old lines
            (5, None, None)
        ] + [
            (0, None, {"partner_id": p.id, "amount": p2amount(p)})
            for p in (self.partner_id + self.partner_id.child_ids)
        ]

    @api.onchange("line_ids")
    def _compute_total(self):
        self.total = sum(line.amount for line in self.line_ids)

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
            self.env["account.invoice"].create(
                {
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


class PosCreditInvoicesLine(models.TransientModel):
    _name = "pos.credit.invoices.company.line"
    _order = "is_company DESC, partner_name"

    wizard_id = fields.Many2one("pos.credit.invoices.company")
    partner_id = fields.Many2one("res.partner", "Partner", readonly=True)
    partner_name = fields.Char("Name", related="partner_id.name", readonly=True)
    is_company = fields.Boolean(related="partner_id.is_company", readonly=True)
    credit_balance = fields.Float(
        "Current Credits", related="partner_id.credit_balance", readonly=True
    )
    amount = fields.Float("Credits to add")
