# Copyright 2017-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).

{
    "name": """Hardware Network Printer""",
    "summary": """Hardware Driver for Network Printers""",
    "category": "Point of Sale",
    "images": [],
    "version": "13.0.2.0.1",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/13.0/hw_printer_network/",
    "license": "Other OSI approved licence",  # MIT
    "price": 59.00,
    "currency": "EUR",
    "depends": ["hw_escpos"],
    "external_dependencies": {"python": [], "bin": []},
    "data": [],
    "qweb": [],
    "demo": [],
    "post_load": "post_load",
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": False,
    "installable": False,
}
