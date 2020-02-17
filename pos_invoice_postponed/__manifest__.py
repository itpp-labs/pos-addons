# -*- coding: utf-8 -*-
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Creation of Postponed invoices in POS""",
    "summary": """This module allows the usage of a regular POS order payment process to create an invoice to be paid later""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version=10.0",
    "images": ["images/postponed2.jpg"],
    "version": "10.0.1.0.1",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@itpp.dev",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "Other OSI approved licence",  # MIT
    "price": 90.00,
    "currency": "EUR",
    "depends": ["point_of_sale"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/views.xml", "views/assets.xml"],
    "demo": [],
    "qweb": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
    # "demo_title": "Creation of Postponed invoices in POS",
    # "demo_addons": [
    # ],
    # "demo_addons_hidden": [
    # ],
    # "demo_url": "DEMO-URL",
    # "demo_summary": "This module allows the usage of a regular POS order payment process to create an invoice to be paid later",
    # "demo_images": [
    #    "images/MAIN_IMAGE",
    # ]
}
