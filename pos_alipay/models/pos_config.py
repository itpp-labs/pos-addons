# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import api, models

MODULE = "pos_alipay"


class PosConfig(models.Model):
    _inherit = "pos.config"

    @api.multi
    def open_session_cb(self):
        res = super(PosConfig, self).open_session_cb()
        self.init_pos_alipay_journals()
        return res

    def init_pos_alipay_journals(self):
        """Init demo Journals for current company"""
        # Multi-company is not primary task for this module, but I copied this
        # code from pos_debt_notebook, so why not
        journal_obj = self.env["account.journal"]
        user = self.env.user
        alipay_journal_active = journal_obj.search(
            [("company_id", "=", user.company_id.id), ("alipay", "!=", False)]
        )
        if alipay_journal_active:
            return

        demo_is_on = self.env["ir.module.module"].search([("name", "=", MODULE)]).demo

        options = {
            "noupdate": True,
            "type": "cash",
            "write_statement": demo_is_on,
        }
        alipay_show_journal = self._create_alipay_journal(
            dict(
                sequence_name="Alipay Payments by Showing QR",
                prefix="ALISHOW-- ",
                journal_name="Alipay Payments by Showing QR",
                code="ALISHOW",
                alipay="show",
                **options
            )
        )
        alipay_scan_journal = self._create_alipay_journal(
            dict(
                sequence_name="Alipay Payments by Scanning QR",
                prefix="ALISCAN- ",
                journal_name="Alipay Payments by Scanning QR",
                code="ALISCAN",
                alipay="scan",
                **options
            )
        )
        if demo_is_on:
            self.write(
                {
                    "journal_ids": [
                        (4, alipay_show_journal.id),
                        (4, alipay_scan_journal.id),
                    ],
                }
            )

    def _create_alipay_journal(self, vals):
        user = self.env.user
        new_sequence = self.env["ir.sequence"].create(
            {
                "name": vals["sequence_name"] + str(user.company_id.id),
                "padding": 3,
                "prefix": vals["prefix"] + str(user.company_id.id),
            }
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
        alipay_journal = self.env["account.journal"].create(
            {
                "name": vals["journal_name"],
                "code": vals["code"],
                "type": vals["type"],
                "alipay": vals["alipay"],
                "journal_user": True,
                "sequence_id": new_sequence.id,
            }
        )
        self.env["ir.model.data"].create(
            {
                "name": "alipay_journal_" + str(alipay_journal.id),
                "model": "account.journal",
                "module": MODULE,
                "res_id": int(alipay_journal.id),
                "noupdate": True,  # If it's False, target record (res_id) will be removed while module update
            }
        )
        if vals["write_statement"]:
            self.write({"journal_ids": [(4, alipay_journal.id)]})
            current_session = self.current_session_id
            statement = [
                (
                    0,
                    0,
                    {
                        "name": current_session.name,
                        "journal_id": alipay_journal.id,
                        "user_id": user.id,
                        "company_id": user.company_id.id,
                    },
                )
            ]
            current_session.write({"statement_ids": statement})
        return alipay_journal
