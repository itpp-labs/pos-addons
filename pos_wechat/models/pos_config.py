# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
from odoo import models

MODULE = "pos_wechat"


class PosConfig(models.Model):
    _inherit = "pos.config"

    def open_session_cb(self, check_coa=True):
        payment_methods_to_write_demo_statements = self.init_pos_wechat_journals()
        for pm in payment_methods_to_write_demo_statements:
            user = self.env.user
            current_session = self.current_session_id
            statement = [
                (
                    0,
                    0,
                    {
                        "name": current_session.name,
                        "payment_method_id": pm.id,
                        "user_id": user.id,
                        "company_id": user.company_id.id,
                    },
                )
            ]
            current_session.write({"statement_ids": statement})
        return super(PosConfig, self).open_session_cb(check_coa)

    def init_pos_wechat_journals(self):
        """Init demo Journals for current company"""
        # Multi-company is not primary task for this module, but I copied this
        # code from pos_debt_notebook, so why not
        journal_obj = self.env["account.journal"]
        user = self.env.user
        wechat_journal_active = journal_obj.search(
            [("company_id", "=", user.company_id.id), ("wechat", "!=", False)]
        )
        if wechat_journal_active:
            return []

        demo_is_on = self.env["ir.module.module"].search([("name", "=", MODULE)]).demo

        options = {"noupdate": True, "type": "cash", "write_statement": demo_is_on}
        wechat_native_pm = self._create_wechat_payment_method(
            dict(
                sequence_name="Wechat Native Payment",
                prefix="WNATIVE-- ",
                journal_name="Wechat Native Payment",
                code="WNATIVE",
                wechat="native",
                **options
            )
        )
        micropay_pm = self._create_wechat_payment_method(
            dict(
                sequence_name="Wechat Micropay",
                prefix="WMICRO- ",
                journal_name="Wechat Micropay",
                code="WMICRO",
                wechat="micropay",
                **options
            )
        )
        if demo_is_on:
            self.write(
                {
                    "payment_method_ids": [
                        (4, wechat_native_pm.id),
                        (4, micropay_pm.id),
                    ]
                }
            )
        return [wechat_native_pm, micropay_pm] if demo_is_on else []

    def _create_wechat_payment_method(self, vals):
        journal = self._create_wechat_journal(vals)
        pm = self.env["pos.payment.method"].create(
            {
                "name": vals["journal_name"],
                "wechat_enabled": True,
                "wechat_journal_id": journal.id,
            }
        )

        return pm

    def _create_wechat_journal(self, vals):
        wechat_journal = self.env["account.journal"].create(
            {
                "name": vals["journal_name"],
                "code": vals["code"],
                "type": vals["type"],
                "wechat": vals["wechat"],
            }
        )
        self.env["ir.model.data"].create(
            {
                "name": "wechat_journal_" + str(wechat_journal.id),
                "model": "account.journal",
                "module": MODULE,
                "res_id": int(wechat_journal.id),
                "noupdate": True,  # If it's False, target record (res_id) will be removed while module update
            }
        )
        return wechat_journal
