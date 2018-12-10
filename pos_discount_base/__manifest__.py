# -*- coding: utf-8 -*-
{
    "name": """POS discount base""",
    "summary": """Technical module in POS""",
    "category": "Point of Sale",
    # "live_test_URL": "",
    "images": [],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    "price": 0.00,
    "currency": "EUR",

    "depends": [
        "pos_discount",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
    ],
    "qweb": [
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
