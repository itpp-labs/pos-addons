# Copyright 2019 Artem Rafailov <https://it-projects.info/team/Ommo73>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Hardware Cashbox""",
    "summary": """The module allows you to open the cashbox through input pin""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/pos-cashbox?version=10.0",
    "images": ["images/pos_cashbox_main.png"],
    "version": "11.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Artem Rafailov",
    "support": "apps@itpp.dev",
    "website": "https://it-projects.info/team/Ommo73",
    "license": "Other OSI approved licence",  # MIT
    # "price": 9.00,
    # "currency": "EUR",
    "depends": ["hw_escpos"],
    "external_dependencies": {"python": [], "bin": []},
    "data": [],
    "qweb": [],
    "demo": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
}
