# -*- coding: utf-8 -*-
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2019 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Inventory Adjustments over POS""",
    "summary": """Inventory Adjustments over POS""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version=10.0",
    "images": [],
    "version": "10.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "Other OSI approved licence",  # MIT
    "price": 29.00,
    "currency": "EUR",
    "depends": ["point_of_sale", "stock", "staged_inventory"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/views.xml", "views/assets.xml"],
    "demo": [],
    "qweb": ["static/src/xml/pos.xml"],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
    # "demo_title": "Inventory Adjustments in POS",
    # "demo_addons": [
    # ],
    # "demo_addons_hidden": [
    # ],
    # "demo_url": "DEMO-URL",
    # "demo_summary": "Inventory Adjustments in POS",
    # "demo_images": [
    #    "images/MAIN_IMAGE",
    # ]
}
