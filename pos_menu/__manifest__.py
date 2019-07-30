# -*- coding: utf-8 -*-
{
    "name": """Product Sets for POS""",
    "summary": """Add own set of products per each POS""",
    "category": "Point Of Sale",
    "images": ["images/pos_menu_main.jpg"],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    "price": 89.00,
    "currency": "EUR",

    "depends": [
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/ir.model.access.csv",
        "views/product_view.xml",
        "views/pos_config_view.xml",
        "views/pos_menu_view.xml",
        "views/pos_menu_template.xml",
    ],
    "qweb": [],
    "demo": [
        "demo/product_set_demo.xml"
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,
}
