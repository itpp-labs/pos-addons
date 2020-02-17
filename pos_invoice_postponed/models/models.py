# -*- coding: utf-8 -*-
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
# License MIT (https://opensource.org/licenses/MIT).

import copy

from odoo import _, api, fields, models
from odoo.tools import float_is_zero

MODULE = "pos_invoice_postponed"


class PosOrder(models.Model):
    _inherit = "pos.order"

    postponed = fields.Boolean("Postponed Invoice", readonly=True)

    def _process_order(self, order):
        # Don't change original dict, because in case of SERIALIZATION_FAILURE
        # the method will be called again
        order = copy.deepcopy(order)
        postponed_payments = False
        account_precision = self.env["decimal.precision"].precision_get("Account")
        # ignore orders with an amount_paid of 0 because those are returns through the POS
        if not float_is_zero(order["amount_paid"], account_precision):
            acc_journal = self.env["account.journal"]
            payments = order.get("statement_ids")
            postponed_payments = filter(
                lambda x: acc_journal.browse(x[2]["journal_id"]).postponed_invoice,
                payments,
            )
            if postponed_payments:
                user_id = self.env["res.users"].browse(order["user_id"])
                partner_id = self.env["res.partner"].browse(order["partner_id"])
                session_id = self.env["pos.session"].browse(order["pos_session_id"])
                # pricelist_id = self.env['res.priselist'].browse(order['pricelist_id'])
                invoice = (
                    self.env["account.invoice"]
                    .sudo()
                    .create(
                        {
                            "name": order["name"],
                            "origin": order["name"],
                            "account_id": partner_id.property_account_receivable_id.id,
                            "journal_id": session_id.config_id.invoice_journal_id.id,
                            "company_id": user_id.company_id.id,
                            "type": "out_invoice",
                            "reference": order["name"],
                            "partner_id": partner_id.id,
                            "comment": "note" in order and order["note"] or "",
                            # considering partner's sale pricelist's currency
                            # 'currency_id': pricelist_id.currency_id.id,
                            "user_id": user_id.id,
                        }
                    )
                )
                order["invoice_id"] = invoice.id
                order["statement_ids"] = [
                    p for p in payments if p not in postponed_payments
                ]
                order["amount_paid"] = order["amount_paid"] - sum(
                    [p[2]["amount"] for p in postponed_payments] + [0]
                )
                order["amount_return"] = max(
                    order["amount_paid"] - order["amount_total"], 0
                )

        res = super(PosOrder, self)._process_order(order)

        if postponed_payments:
            res.sudo().write(
                {"state": "invoiced", "invoice_id": invoice.id, "postponed": True}
            )
            invoice._onchange_partner_id()
            invoice.fiscal_position_id = res.fiscal_position_id
            message = _(
                "This Postponed invoice has been created from the point of sale session: <a href=# data-oe-model=pos.order data-oe-id=%d>%s</a>"
            ) % (res.id, res.name)
            invoice.message_post(body=message)
            for line in res.lines:
                self._action_create_invoice_line(line, invoice.id)
            invoice.sudo().compute_taxes()
            invoice.sudo().action_invoice_open()

        return res

    def test_paid(self):
        res = super(PosOrder, self).test_paid()
        if res:
            return res

        for order in self:
            if (not order.lines) or (
                not order.postponed
                and (
                    not order.statement_ids
                    or (abs(order.amount_total - order.amount_paid) > 0.00001)
                )
            ):
                return False
        return True


class AccountJournal(models.Model):
    _inherit = "account.journal"

    postponed_invoice = fields.Boolean("Create Postponed Invoice")


class PosConfig(models.Model):
    _inherit = "pos.config"

    @api.multi
    def open_session_cb(self):
        res = super(PosConfig, self).open_session_cb()
        self.init_postponed_journal()
        return res

    def init_postponed_journal(self):
        """Init demo Journals for current company"""
        demo_is_on = (
            self.env["ir.module.module"].sudo().search([("name", "=", MODULE)]).demo
        )
        if not demo_is_on:
            return
        # Multi-company is not primary task for this module, but I copied this
        # code from pos_debt_notebook, so why not
        journal_obj = self.env["account.journal"]
        user = self.env.user
        pin_journal_active = journal_obj.search(
            [
                ("company_id", "=", user.company_id.id),
                ("postponed_invoice", "!=", False),
            ]
        )
        if pin_journal_active:
            return

        pin_journal = self._create_postponed_journal(
            dict(
                sequence_name="Postponed",
                prefix="POSTPONED-- ",
                journal_name="Postponed",
                code="POSTPONED",
                noupdate=True,
                type="bank",
                write_statement=demo_is_on,
            )
        )
        self.write({"journal_ids": [(4, pin_journal.id)]})
        return

    def _create_postponed_journal(self, vals):
        user = self.env.user
        new_sequence = (
            self.env["ir.sequence"]
            .sudo()
            .create(
                {
                    "name": vals["sequence_name"] + str(user.company_id.id),
                    "padding": 3,
                    "prefix": vals["prefix"] + str(user.company_id.id),
                }
            )
        )
        self.env["ir.model.data"].create(
            {
                "name": "journal_sequence" + str(new_sequence.id),
                "model": "ir.sequence",
                "module": MODULE,
                "res_id": new_sequence.id,
                "noupdate": True,  # If it's False, target record (res_id) will be removed while module update
            }
        )
        pin_journal = (
            self.env["account.journal"]
            .sudo()
            .create(
                {
                    "name": vals["journal_name"],
                    "code": vals["code"],
                    "type": vals["type"],
                    "journal_user": True,
                    "sequence_id": new_sequence.id,
                    "postponed_invoice": True,
                }
            )
        )
        self.env["ir.model.data"].create(
            {
                "name": "pin_journal_" + str(pin_journal.id),
                "model": "account.journal",
                "module": MODULE,
                "res_id": int(pin_journal.id),
                "noupdate": True,  # If it's False, target record (res_id) will be removed while module update
            }
        )
        if vals["write_statement"]:
            self.write({"journal_ids": [(4, pin_journal.id)]})
            current_session = self.current_session_id
            statement = [
                (
                    0,
                    0,
                    {
                        "name": current_session.name,
                        "journal_id": pin_journal.id,
                        "user_id": user.id,
                        "company_id": user.company_id.id,
                    },
                )
            ]
            current_session.write({"statement_ids": statement})
        return pin_journal
