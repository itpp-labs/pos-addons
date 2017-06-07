# -*- coding: utf-8 -*-
{
    "name": """POS Network Printer""",
    "summary": """The module allows to send orders for printing using a network printer in the POS""",
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
        "pos_restaurant_base",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_printer_network_template.xml",
        "views/pos_printer_network_view.xml",
    ],
    'qweb': [
        "static/src/xml/pos_printer_network.xml",
    ],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
