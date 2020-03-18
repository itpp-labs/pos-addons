# -*- coding: utf-8 -*-
# Copyright 2017-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017 gnidorah <https://github.com/gnidorah>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

from odoo.tests.common import TransactionCase


class TestPosCreditUpdate(TransactionCase):
    def setUp(self):
        super(TestPosCreditUpdate, self).setUp()
        # since update 5.0.0 the field journal_id is required for model pos.credit.update
        self.user = self.env.user
        self.debt_account = self.env["account.account"].create(
            {
                "name": "Debt",
                "code": "XTST",
                "user_type_id": self.env.ref(
                    "account.data_account_type_current_assets"
                ).id,
                "company_id": self.user.company_id.id,
                "note": 'code "TST" is used for tests',
            }
        )
        self.journal = self.env["pos.config"].create_journal(
            {
                "sequence_name": "Test Credit Journal",
                "prefix": "TST ",
                "user": self.user,
                "noupdate": True,
                "journal_name": "Test Credit Journal",
                "code": "TSTJ",
                "type": "cash",
                "debt": True,
                "journal_user": True,
                "debt_account": self.debt_account,
                "credits_via_discount": False,
                "category_ids": False,
                "write_statement": True,
                "debt_dummy_product_id": False,
                "debt_limit": 0,
                "pos_cash_out": True,
                "credits_autopay": False,
            }
        )

    def get_credit_balance(self, balance, new_balance):
        return -balance + new_balance

    def test_newbalance(self):
        partner_id = 8
        posCreditUpdate = self.env["pos.credit.update"]
        for i, new_balance in enumerate([0, 20, -20, 15, 10]):
            posCreditUpdate.create(
                {
                    "id": i,
                    "partner_id": partner_id,
                    "new_balance": new_balance,
                    "state": "draft",
                    "update_type": "new_balance",
                    "journal_id": self.journal.id,
                }
            )
        entries = posCreditUpdate.search(
            [
                ("partner_id", "=", partner_id),
                ("state", "=", "cancel"),
                ("update_type", "=", "new_balance"),
            ]
        )
        credit_balance = posCreditUpdate.partner_id.browse(partner_id).credit_balance
        for e in entries:
            self.assertEqual(
                credit_balance, self.get_credit_balance(e.balance, e.new_balance)
            )

        for i, new_balance in enumerate([40, 20, -40, 35, -5]):
            posCreditUpdate.write(
                {
                    "id": i,
                    "partner_id": partner_id,
                    "new_balance": new_balance,
                    "state": "draft",
                    "update_type": "new_balance",
                    "journal_id": self.journal.id,
                }
            )
        entries = posCreditUpdate.search(
            [
                ("partner_id", "=", partner_id),
                ("state", "=", "cancel"),
                ("update_type", "=", "new_balance"),
            ]
        )
        credit_balance = posCreditUpdate.partner_id.browse(partner_id).credit_balance
        for e in entries:
            self.assertEqual(
                credit_balance, self.get_credit_balance(e.balance, e.new_balance)
            )
