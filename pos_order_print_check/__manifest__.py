# -*- coding: utf-8 -*-
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Check PosBox Connection""",
    "summary": """Check the connection to PosBox before printing to avoid loosing the orders""",
    "category": "Point of Sale",
    "live_test_url": "http://apps.it-projects.info/shop/product/pos-order-print-check?version=10.0",
    "images": ["images/pos_order_print_check_main.jpg"],
    "version": "10.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@itpp.dev",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "Other OSI approved licence",  # MIT
    "price": 89.00,
    "currency": "EUR",
    "depends": ["pos_restaurant_base", "web_tour"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/pos_order_print_check_template.xml", "views/assets_demo.xml"],
    "demo": [],
    "qweb": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
    "demo_title": "Check PosBox Connection",
    "demo_addons": [],
    "demo_addons_hidden": [],
    "demo_url": "pos-order-print-check",
    "demo_summary": "Check the connection to PosBox before printing POS orders",
    "demo_images": ["images/pos_order_print_check_main.jpg"],
}
