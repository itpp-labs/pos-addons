# -*- coding: utf-8 -*-
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).


def migrate(cr, version):
    # update new credit_product column with the tempory one
    cr.execute("UPDATE product_template SET credit_product=temporary_credit_product")

    # Drop temporary column
    cr.execute("ALTER TABLE product_template DROP COLUMN temporary_credit_product")
