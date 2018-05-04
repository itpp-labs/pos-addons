# -*- coding: utf-8 -*-
{
    "name": """Barcode synchronization with POS""",
    "summary": """Synchronize barcodes after updating one for POSes""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": [],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

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
}
