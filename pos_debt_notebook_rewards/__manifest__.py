# -*- coding: utf-8 -*-
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Rewards for shifts in POS Debt & Credit notebook""",
    "summary": """Rewards for shifts in POS Debt & Credit notebook""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": [],
    "version": "10.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "Other OSI approved licence",  # MIT
    # "price": 9.00,
    # "currency": "EUR",
    "depends": ["pos_debt_notebook", "base_attendance", "barcodes"],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/pos_debt_notebook_reward_security.xml",
        "views/reward_view.xml",
        "views/reward_type_view.xml",
        "security/ir.model.access.csv",
    ],
    "qweb": [],
    "demo": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
}
