# -*- coding: utf-8 -*-
{
    "name": """Rewards for shifts in POS Debt & Credit notebook""",
    "summary": """Rewards for shifts in POS Debt & Credit notebook""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        "pos_debt_notebook",
        "base_attendance",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        'views/reward_view.xml',
        'views/reward_type_view.xml',
        'security/ir.model.access.csv',
    ],
    "qweb": [
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,
}
