# -*- coding: utf-8 -*-
{
    "name": """Internal Credit System""",
    "summary": """Credit payment system for festivals, food courts, etc.""",
    "category": "Point of Sale",
    'live_test_url': 'http://apps.it-projects.info/shop/product/internal-credit-system?version=10.0',
    "images": ['images/credit.png'],
    "version": "10.0.1.1.2",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
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

    "demo_title": "Internal Credit System",
    "demo_addons": [
    ],
    "demo_addons_hidden": [
    ],
    "demo_url": "internal-credit-system",
    "demo_summary": "Organize your cash-free system for set of shops with a single payment point. E.g. at festivals, amusements parks, etc.",
    "demo_images": [
        "images/credit.png",
    ]
}
