# -*- coding: utf-8 -*-
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).


def migrate(cr, version):

    # Add temporary credit product column
    cr.execute("ALTER TABLE product_template ADD temporary_credit_product int")

    # Select debt journals
    cr.execute("SELECT id FROM account_journal WHERE account_journal.debt is true")

    # Take the first journal
    journal_id = cr.fetchone()
    if journal_id:
        # set token one to all credit products
        cr.execute(
            "UPDATE product_template SET temporary_credit_product=%s WHERE credit_product is true",
            journal_id,
        )
