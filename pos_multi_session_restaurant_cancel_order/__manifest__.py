# -*- coding: utf-8 -*-
{
    "name": """Pos Multi Session Restaurant Cancel Order""",
    "summary": """Technical module to provide compitability the pos_multi_session_restaurant and pos_cancel_order modules""",
    "category": "Point of Sale",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    # "price": 0.00,
    # "currency": "EUR",

    "depends": [
        "pos_multi_session_restaurant",
        "pos_order_cancel",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
    ],
    'qweb': [
    ],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": True,
    "installable": True,
}
