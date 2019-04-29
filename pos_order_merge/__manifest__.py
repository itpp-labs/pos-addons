# -*- coding: utf-8 -*-
{
    "name": """Merge POS Orders""",
    "summary": """Merge POS orders into a single order""",
    "category": "Point of Sale",
    "images": ["images/pos_order_merge_main.jpg"],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov, Alexandr Kolushov",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    "price": 69.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_order_merge_template.xml",
        "views/pos_config_view.xml",
    ],
    "qweb": [
        "static/src/xml/merge.xml",
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,
}
