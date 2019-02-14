# -*- coding: utf-8 -*-
{
    "name": """POS Advanced Order Notes""",
    "summary": """Set predefined notes for separate product or entire order""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/pos_order_note_main.png"],
    "version": "10.0.1.2.2",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    "price": 34.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant_base",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/ir.model.access.csv",
        "views/views.xml",
        "views/template.xml",
    ],
    "qweb": [
        "static/src/xml/order_note.xml",
    ],
    "demo": [
        "data/pos_product_notes_demo.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
