# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Disable options in POS (restaurant extension)""",
    "summary": """Control access to POS restaurant options""",
    "category": "Point of Sale",
    "live_test_url": "http://apps.it-projects.info/shop/product/pos-disable-payment-restaurant?version=10.0",
    "images": ["images/pos_disable_payment_restaurant.jpg"],
    "version": "10.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "Other OSI approved licence",  # MIT
    "price": 29.00,
    "currency": "EUR",
    "depends": ["pos_disable_payment", "pos_restaurant", "web_tour"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/template.xml", "views/view.xml", "views/assets_demo.xml"],
    "qweb": [],
    "demo": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
    "demo_title": "Disable options in POS (restaurant extension)",
    "demo_addons": [],
    "demo_addons_hidden": [],
    "demo_url": "pos-disable-payment-restaurant",
    "demo_summary": "Control access to POS restaurant options",
    "demo_images": ["images/pos_disable_payment_restaurant.jpg"],
}
