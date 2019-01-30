# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """Customizable POS Kitchen Ticket""",
    "summary": """Customize POS kitchen ticket as you need""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": [],
    "version": "10.0.1.0.5",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    "price": 20.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant_base",
        "pos_receipt_custom_template",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/view.xml",
        "views/template.xml",
        "data/pos_order_receipt_custom_data.xml",
    ],
    "demo": [
    ],
    "qweb": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,
}
