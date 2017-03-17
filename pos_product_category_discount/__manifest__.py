# -*- coding: utf-8 -*-
{
    "name": """Product categories discount in POS""",
    "summary": """Product categories discount in POS""",
    "category": "Point of Sale",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    "price": 100.00,
    "currency": "EUR",

    "depends": [
        'point_of_sale',
        'pos_discount',
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        'views/template.xml',
        'views/view.xml',
        'security/ir.model.access.csv',
    ],
    'qweb': [
        'static/src/xml/DiscountProgram.xml',
    ],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
