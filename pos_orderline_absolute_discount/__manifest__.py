# -*- coding: utf-8 -*-
{
    "name": """Absolute Discounts in POS""",
    "summary": """Set absolute discount if the percentages are not convenient or just boring""",
    "category": "Point of Sale",
    "live_test_url": 'http://apps.it-projects.info/shop/product/pos-orderline-absolute-discount?version=10.0',
    "images": ["images/pos_orderline_abs_disc_main.png"],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    "price": 79.00,
    "currency": "EUR",

    "depends": [
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
        "views/pos_order_view.xml",
        "views/pos_config_view.xml",
        "views/report_saledetails.xml",
    ],
    "qweb": [
        "static/src/xml/pos.xml",
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,

    "demo_title": "Absolute Discounts in POS",
    "demo_addons": [
    ],
    "demo_addons_hidden": [
    ],
    "demo_url": "pos-orderline-absolute-discount",
    "demo_summary": "Use multiple POSes for handling orders",
    "demo_images": [
        "images/pos_orderline_abs_disc_main.png",
    ]
}
