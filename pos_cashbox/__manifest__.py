# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """Open CashBox from Backend""",
    "summary": """The module allows to open Cashbox/Cashdrawer from Backend""",
    "category": "Point of Sale",
    "live_test_url": "http://apps.it-projects.info/shop/product/pos-cashbox?version=10.0",
    "images": ['images/pos_cashbox_main.png'],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    "price": 49.00,
    "currency": "EUR",

    "depends": [
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_cashbox_template.xml",
        "views/pos_cashbox_view.xml",
    ],
    "qweb": [
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,

    "demo_title": "Open CashBox from Backend",
    "demo_addons": [
    ],
    "demo_addons_hidden": [
    ],
    "demo_url": "pos-cashbox",
    "demo_summary": "The module allows to open the CashBox from Backend",
    "demo_images": [
        "images/pos_cashbox_main.png",
    ]
}
