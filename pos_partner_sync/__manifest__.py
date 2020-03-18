# -*- coding: utf-8 -*-
# Copyright (c) 2004-2015 Odoo S.A.
# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2018 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Sync Partners in POS""",
    "summary": """Instant updates of the partner data in POS""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/pos-partner-sync?version=10.0",
    "images": ["images/pos_partner_sync.jpg"],
    "version": "10.0.2.0.1",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "Other OSI approved licence",  # MIT
    "price": 49.00,
    "currency": "EUR",
    "depends": ["point_of_sale", "pos_longpolling"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/assets.xml", "views/pos_config.xml"],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
    "demo_title": "Sync Partner data in POS",
    "demo_addons": [],
    "demo_addons_hidden": [],
    "demo_url": "pos-partner-sync",
    "demo_summary": "Update the partner data in POS instantly",
    "demo_images": ["images/pos_partner_sync_main.png"],
}
