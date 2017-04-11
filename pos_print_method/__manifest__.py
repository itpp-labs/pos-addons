# -*- coding: utf-8 -*-
{
    "name": """POS Print Method""",
    "summary": """Choose print method for order printing in POS""",
    "category": "Point of Sale",
    "images": ['images/print_method_main.png'],
    "version": "1.0.0",

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "AGPL-3",
    "price": 69.00,
    "currency": "EUR",

    "depends": [
        'pos_restaurant',
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        'views/template.xml',
        'views/view.xml',
    ],
    'qweb': [],
    "demo": [],
    "installable": True,
    "auto_install": False,
}
