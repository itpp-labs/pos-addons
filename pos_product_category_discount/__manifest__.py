# -*- coding: utf-8 -*-
{
    "name": """POS Discount Programs""",
    "summary": """Use predefined discount programs for products in POS""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/dp3.png"],
    "version": "1.1.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    "price": 39.00,
    "currency": "EUR",

    "depends": [
        "pos_discount_base",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
        "views/view.xml",
        "security/ir.model.access.csv",
    ],
    "qweb": [
        "static/src/xml/DiscountProgram.xml",
    ],
    "demo": [
        "data/pos_product_category_discount_demo.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
