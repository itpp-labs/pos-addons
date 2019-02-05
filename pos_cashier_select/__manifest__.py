# -*- coding: utf-8 -*-
{
    "name": """POS Cashier Select""",
    "summary": """Forced choose a cashier before switching to payment screen""",
    "category": "Point of Sale",
    "images": ['images/pos_cashier_select.png'],
    "version": "10.0.1.0.1",
    "application": False,

    "author": "IT-Projects LLC, Artyom Losev",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info",
    "license": "LGPL-3",
    "price": 39.00,
    "currency": "EUR",

    "depends": [
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/views.xml",
    ],
    "qweb": [
        "static/src/xml/pos.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
