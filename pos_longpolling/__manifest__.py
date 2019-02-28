# -*- coding: utf-8 -*-
{
    "name": """POS Longpolling""",
    "summary": """Technical module implement instant updates in POS""",
    "category": "Point of Sale",
    "images": [],
    "version": "10.0.2.1.1",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    # "price": 0.00,
    # "currency": "EUR",

    "depends": [
        "bus",
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_longpolling_template.xml",
        "views/pos_longpolling_view.xml",
    ],
    "qweb": [
        "static/src/xml/pos_longpolling_connection.xml",
    ],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
