# -*- coding: utf-8 -*-
{
    "name": """Lock POS Screen""",
    "summary": """Users/Cashiers can unlock POS screen by scanning their barcode or using security PIN""",
    "category": "Point of Sale",
    "live_test_url": "http://apps.it-projects.info/shop/product/pos-logout?version=11.0",
    "images": ["images/pos_logout_main.png"],
    "version": "11.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    "price": 39.00,
    "currency": "EUR",

    "depends": [
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_logout.xml",
    ],
    "qweb": [
        "static/src/xml/pos.xml"
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,

    "demo_title": "Lock POS Screen",
    "demo_addons": [
    ],
    "demo_addons_hidden": [
    ],
    "demo_url": "pos-logout",
    "demo_summary": "Users/Cashiers can unlock POS screen by scanning their barcode or using security PIN",
    "demo_images": [
        "images/pos_logout_main.png",
    ]
}
