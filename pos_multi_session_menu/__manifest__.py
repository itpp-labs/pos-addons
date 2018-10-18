# -*- coding: utf-8 -*-
{
    "name": """POS Multi Session Menu""",
    "summary": """Own set of products for each Multi Session""",
    "category": "point_of_sale",
    # "live_test_url": "",
    "images": [],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        "pos_multi_session",
        "pos_menu",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_menu_view.xml",
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
}
