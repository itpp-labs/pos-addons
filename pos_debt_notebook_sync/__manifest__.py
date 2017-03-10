# -*- coding: utf-8 -*-
{
    "name": """Internal Credit System""",
    "summary": """Credit payment system for festivals, food courts, etc.""",
    "category": "Point of Sale",
    "images": ['images/credit.png'],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    "price": 510.00,
    "currency": "EUR",

    "depends": [
        "base_action_rule",
        "pos_longpolling",
        "pos_debt_notebook",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
        "data/base_action_rule.xml",
    ],
    'qweb': [],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
