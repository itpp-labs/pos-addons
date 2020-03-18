# -*- coding: utf-8 -*-
{
    "name": """POS Network Printer""",
    "summary": """The time has come. Print POS orders and receipts by using network printers""",
    "category": "Point of Sale",
    "images": ["images/pos_printer_network_main.png"],
    "version": "10.0.2.1.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "Other OSI approved licence",  # MIT
    "price": 340.00,
    "currency": "EUR",
    "depends": ["pos_restaurant_base"],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_printer_network_template.xml",
        "views/pos_printer_network_view.xml",
    ],
    "qweb": ["static/src/xml/pos_printer_network.xml"],
    "demo": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": False,
    "installable": True,
}
