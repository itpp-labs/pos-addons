# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

import odoo.tests


@odoo.tests.common.at_install(True)
@odoo.tests.common.post_install(True)
class TestUi(odoo.tests.TransactionCase):

    def test_the_same_request(self):

        multi_session = self.env['pos.multi_session'].search([], limit=1)

        ms_model = self.env["pos_multi_session_sync.multi_session"]

        allow_public = self.env['ir.config_parameter'].get_param('pos_longpolling.allow_public')
        if allow_public:
            ms_model = ms_model.sudo()
        ms = ms_model.search([('multi_session_ID', '=', int(multi_session.id)),
                             ('dbname', '=', self.env.cr.dbname)])
        if not ms:
            ms = ms_model.create({'multi_session_ID': int(multi_session.id), 'dbname': self.env.cr.dbname})

        message = {
            "action": "update_order",
            "data": {
                "nonce": 'test_nonce',
                "name": "Order 00003-001-0001",
                "amount_paid": 0,
                "amount_total": 4.8,
                "amount_tax": 0,
                "amount_return": 0,
                "lines": [[0, 0, {
                    "qty": 1,
                    "price_unit": 4.8,
                    "discount": 0,
                    "product_id": 50,
                    "tax_ids": [[6, False, []]],
                        "id": 1,
                        "pack_lot_ids": [],
                        "uid": "00003-001-0001-1",
                        "ms_info": {
                            "created": {
                                "user": {
                                    "id": 1,
                                    "name": "Administrator"
                                },
                                "pos": {
                                    "id": 1,
                                    "name": "Main"
                                }
                            }
                        }
                }]],
                "statement_ids": [],
                "pos_session_id": 3,
                "partner_id": False,
                "user_id": 1,
                "uid": "00003-001-0001",
                "sequence_number": 1,
                "creation_date": "2018-07-09 09:20:25",
                "fiscal_position_id": False,
                "ms_info": {"created": {
                    "user": {"id": 1,
                             "name": "Administrator"},
                    "pos": {"id": 1,
                            "name": "Main"}}},
                "revision_ID": 1,
                "new_order": False,
                "run_ID": 1,
                "pos_id": 1
            }
        }

        res = ms.on_update_message(message)
        self.assertNotEqual(res['action'], 'revision_error')

        message['data']['revision_ID'] = 2
        res = ms.on_update_message(message)
        self.assertNotEqual(res['action'], 'revision_error')
