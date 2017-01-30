# -*- coding: utf-8 -*-
{
    "name": """Sync POS""",
    "summary": """Sync POS""",
    "category": "Point of Sale",
    "images": [],
    "version": "1.0.0",

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    # "price": 0.00,
    # "currency": "EUR",

    "depends": [
        'bus',
        'point_of_sale',
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        'views/pos_longpolling_template.xml',
    ],
    'qweb': [],
    "demo": [],
    "installable": True,
    "auto_install": False,
}
