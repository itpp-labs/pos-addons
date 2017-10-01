# -*- coding: utf-8 -*-
{
    "name": """POS Mobile""",
    "summary": """Your Point of Sale in the Mobile Version""",
    "category": "Point of Sale",
    # "live_test_URL": "",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    # "price": 0.00,
    # "currency": "EUR",

    "depends": [
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_mobile_template.xml",
        "views/pos_mobile_views.xml"
    ],
    "qweb": [
        "static/src/xml/pos.xml"
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
