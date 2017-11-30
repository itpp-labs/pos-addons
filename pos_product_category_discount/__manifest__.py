# -*- coding: utf-8 -*-
{
    "name": """POS Discount Programs""",
    "summary": """Use predefined discount programs for products in POS""",
    "category": "Point of Sale",
    "live_test_url": 'http://apps.it-projects.info/shop/product/pos-product-category-discount?version=10.0',
    "images": ['images/dp3.png'],
    "version": "1.1.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    "price": 39.00,
    "currency": "EUR",

    "depends": [
        'point_of_sale',
        'pos_discount',
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        'views/template.xml',
        'views/view.xml',
        'security/ir.model.access.csv',
    ],
    'qweb': [
        'static/src/xml/DiscountProgram.xml',
    ],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": False,

    "demo_title": "POS Discount Programs",
    "demo_addons": [
    ],
    "demo_addons_hidden": [
    ],
    "demo_url": "pos-product-category-discount",
    "demo_summary": "Use predefined discount programs for products in POS",
    "demo_images": [
        "images/dp3.png",
    ]
}
