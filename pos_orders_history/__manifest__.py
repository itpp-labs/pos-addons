# -*- coding: utf-8 -*-
{
    "name": """POS Orders History""",
    "summary": """Work with paid POS Orders directly in POS interface.""",
    "category": "point_of_sale",
    # "live_test_URL": "",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    # "price": 50.00,
    # "currency": "EUR",

    "depends": [
        "base_action_rule",
        "pos_longpolling",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_orders_history_view.xml",
        "views/pos_orders_history_template.xml",
        "data/base_action_rule.xml",
    ],
    "qweb": [
        "static/src/xml/pos.xml",
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
