# -*- coding: utf-8 -*-
{
    "name": """Print certain products on Order Printers""",
    "summary": """Specify certain products to be allowed to print on order printers""",
    "category": "Point of Sale",
    # "live_test_URL": "",
    "images": ['images/pos_order_printer_product_main.png'],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    "price": 49.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant",
        "pos_restaurant_base",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/view.xml",
        "views/template.xml",
    ],
    "qweb": [
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
