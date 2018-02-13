# -*- coding: utf-8 -*-
{
    "name": """POS Print Method""",
    "summary": """Choose print method for order printing in POS""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/pm1.png"],
    "version": "10.0.1.0.1",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    "price": 69.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant",
        "pos_restaurant_base",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
        "views/view.xml",
    ],
    "qweb": [
    ],
    "demo": [
        "data/restaurant_printer_demo.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
