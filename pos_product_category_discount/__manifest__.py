# -*- coding: utf-8 -*-
{
    "name": """POS Discount Programs""",
    "summary": """Use predefined discount programs for products in POS""",
    "category": "Point of Sale",
    "live_test_url": 'http://apps.it-projects.info/shop/product/pos-product-category-discount?version=10.0',
    "images": ['images/dp3.png'],
    "version": "10.0.1.2.4",
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
