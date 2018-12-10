{
    "name": """POS Print Method""",
    "summary": """Choose print method for order printing in POS""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/pm1.png"],
    "version": "12.0.1.0.1",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_print_method/",
    "license": "LGPL-3",
    "price": 34.00,
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
