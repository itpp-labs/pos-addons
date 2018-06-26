# -*- coding: utf-8 -*-
# Copyright 2018 Losev Artyom
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """POS Orders History Reprint""",
    "summary": """Reprint paid POS Orders with POS interface.""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": [],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Losev Artyom",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        "pos_orders_history",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/ir.model.access.csv",
        "views/template.xml",
        "views/view.xml",
        "data/base_action_rule.xml",
    ],
    "demo": [
    ],
    "qweb": [
        "static/src/xml/main.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,
}
