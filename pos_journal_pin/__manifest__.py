# -*- coding: utf-8 -*-
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2019 Kildebekov Anvar <https://it-projects.info/team/kildebekov>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """POS Payments by Manager's PIN""",
    "summary": """Ask for manager permission before use the journal""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version=10.0",
    "images": ["images/pos_journal_pin.jpg"],
    "version": "10.0.1.0.1",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@itpp.dev",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "Other OSI approved licence",  # MIT
    "price": 80.00,
    "currency": "EUR",
    "depends": ["pos_pin"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/assets.xml", "views/views.xml"],
    "demo": [],
    "qweb": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
    # "demo_title": "Ask Manager to use journal",
    # "demo_addons": [
    # ],
    # "demo_addons_hidden": [
    # ],
    # "demo_url": "DEMO-URL",
    # "demo_summary": "Ask Manager to use journal",
    # "demo_images": [
    #    "images/MAIN_IMAGE",
    # ]
}
