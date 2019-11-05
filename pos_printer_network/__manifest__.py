{
    "name": """POS Network Printer""",
    "summary": """The time has come. Print POS orders and receipts by using network printers""",
    "category": "Point of Sale",
    "images": ['images/pos_printer_network_main.png'],
    "version": "12.0.2.1.1",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_printer_network/",
    "license": "LGPL-3",
    "price": 340.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant",
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
