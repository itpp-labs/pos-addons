# -*- coding: utf-8 -*-
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2019 Kildebekov Anvar  <https://it-projects.info/team/kildebekov>
# License MIT (https://opensource.org/licenses/MIT).

from odoo import api, fields, models

MODULE = "pos_journal_pin"


class AccountInvoice(models.Model):
    _inherit = "account.journal"

    ask_manager = fields.Boolean(
        "Manager's permission",
        help="Ask for Manager's permission to use the journal in POS",
    )


class PosConfig(models.Model):
    _inherit = "pos.config"

    @api.multi
    def open_session_cb(self):
        res = super(PosConfig, self).open_session_cb()
        self.init_pin_journal()
        return res

    def init_pin_journal(self):
        """Init demo Journals for current company"""
        # Access rejection of demo user, "*.sudo().*" - superuser-rights for creating session
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
            [("company_id", "=", user.company_id.id), ("ask_manager", "!=", False)]
        )
        if pin_journal_active:
            return

        pin_journal = self._create_pin_journal(
            dict(
                sequence_name="Pin to Pay",
                prefix="PINNED-- ",
                journal_name="Pin to Pay",
                code="PINNED",
                noupdate=True,
                type="cash",
                write_statement=demo_is_on,
            )
        )
        self.write({"journal_ids": [(4, pin_journal.id)]})
        return

    def _create_pin_journal(self, vals):
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
                    "ask_manager": True,
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
