# -*- coding: utf-8 -*-
{
    "name": """Cancel product or order in POS""",
    "summary": """Cancel product or order in POS""",
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
        'pos_restaurant',
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/ir.model.access.csv",
        "views/template.xml",
        "views/views.xml",
    ],
    'qweb': [
        'static/src/xml/cancel_order.xml',
    ],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
