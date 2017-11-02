# -*- coding: utf-8 -*-
{
    "name": """POS Advanced Order Notes""",
    "summary": """Set predefined notes for separate product or entire order""",
    "category": "Point of Sale",
    "images": ['images/pos_order_note_main.png'],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    "price": 69.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/ir.model.access.csv",
        "views/views.xml",
        "views/template.xml",
    ],
    'qweb': [
        "static/src/xml/order_note.xml",
    ],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": False,
}
