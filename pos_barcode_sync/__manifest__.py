# -*- coding: utf-8 -*-
{
    "name": """Sync Barcode in POS""",
    "summary": """Update the partner data in POS instantly""",
    "category": "Point of Sale",
    "live_test_url": "http://apps.it-projects.info/shop/product/pos-barcode-sync?version=10.0",
    "images": ["images/pos_barcode_sync_main.jpeg"],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "LGPL-3",
    "price": 24.00,
    "currency": "EUR",

    "depends": [
        "point_of_sale",
        "pos_longpolling",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "data.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,

    "demo_title": "Sync Barcode in POS",
    "demo_addons": [
    ],
    "demo_addons_hidden": [
    ],
    "demo_url": "pos-barcode-sync",
    "demo_summary": "Update the partner data in POS instantly",
    "demo_images": [
        "images/pos_barcode_sync_main.png",
    ]
}
