# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).
# pylint: disable=method-required-super

from mock import MagicMock

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.HttpCase):
    def test_pos_invoice_pay(self):
        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        env = self.env
        env["ir.module.module"].search(
            [("name", "=", "pos_invoice_pay")], limit=1
        ).state = "installed"
        # without a delay there might be problems on the steps whilst opening a POS
        # caused by a not yet loaded button's action
        self.phantom_js(
            "/web",
            "odoo.__DEBUG__.services['web_tour.tour'].run('tour_pos_invoice_pay', 1000)",
            "odoo.__DEBUG__.services['web_tour.tour'].tours.tour_pos_invoice_pay.ready",
            login="admin",
            timeout=200,
        )


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestModel(odoo.tests.SingleTransactionCase):
    def test_pay_more_than_enough(self):
        class MockedAccountPayment:
            def __init__(self):
                self.param = None

            def create(self, param):  # pylint: disable=method-required-super
                self.param = param
                return self

            def post(self):
                pass

        class MockedAccountInvoice:
            def __init__(self, residual):
                self.residual = residual

            def browse(self, arg=None, prefetch=None):
                mock = MagicMock()
                mock.residual = self.residual
                return mock

        class MockedEnv:
            def __init__(self, env, mocked_models):
                self.env = env
                self.mocked_models = mocked_models

            def __getitem__(self, item):
                if item in self.mocked_models:
                    return self.mocked_models[item]
                return self.env[item]

            def __setitem__(self, key, item):
                self.mocked_models[key] = item

        def make_payment(due, tendered, total):
            """
            Generates input value for process_invoice_payment
            """
            return {
                "data": {
                    "amount_paid": tendered,
                    "amount_return": tendered,
                    "amount_tax": 0,
                    "amount_total": 0,
                    "creation_date": "2019-09-06 09:32:55",
                    "fiscal_position_id": False,
                    "invoice_to_pay": {
                        "amount_tax": 0,
                        "amount_total": total,
                        "amount_untaxed": total,
                        "date_due": "2019-09-06",
                        "date_invoice": "2019-09-06",
                        "id": 9,
                        "lines": [],  # values are taken away
                        "name": "",
                        "number": "INV/2019/0005",
                        "origin": "SO004",
                        "partner_id": [35, "China Export, Jacob Taylor"],
                        "residual": due,
                        "state": "Open",
                        "user_id": [1, "Administrator"],
                    },
                    "lines": [],
                    "name": "Order 00001-005-0001",
                    "partner_id": False,
                    "pos_session_id": 1,
                    "sequence_number": 1,
                    "statement_ids": [
                        [
                            0,
                            0,
                            {
                                "account_id": 27,
                                "amount": tendered,
                                "journal_id": 7,
                                "name": "2019-09-06 09:32:55",
                                "statement_id": 2,
                            },
                        ]
                    ],
                    "uid": "00001-005-0001",
                    "user_id": 1,
                },
                "id": "00001-005-0001",
                "to_invoice": False,
            }

        mocked_account_payment = MockedAccountPayment()

        mocked_env = MockedEnv(
            self.env,
            {
                "account.payment": mocked_account_payment,
                "account.invoice": MagicMock(),
                "account.journal": MagicMock(),
                "pos.session": MagicMock(),
            },
        )

        sample = mocked_env["pos.order"].search([], limit=1)
        sample.env = mocked_env

        total = 2240
        tendered = 1000
        due = total
        # tendered is less than due, so we must store payment with tendered value
        expected_amount = tendered

        sample.env["account.invoice"] = MockedAccountInvoice(due)
        sample.process_invoice_payment(make_payment(due, tendered, total))
        self.assertEqual(mocked_account_payment.param["amount"], expected_amount)

        total = 2240
        tendered = 2000
        due = 1240
        # tendered is greater than due, so we must store payment with due value, 'cos we give change back
        expected_amount = due

        sample.env["account.invoice"] = MockedAccountInvoice(due)
        sample.process_invoice_payment(make_payment(due, tendered, total))
        self.assertEqual(mocked_account_payment.param["amount"], expected_amount)
