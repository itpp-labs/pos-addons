# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).

{
    "name": """Internal Credit System""",
    "summary": """Credit payment system for festivals, food courts, etc.""",
    "category": "Point of Sale",
    "live_test_url": "http://apps.it-projects.info/shop/product/internal-credit-system?version=13.0",
    "images": ["images/credit.png"],
    "version": "13.0.1.1.2",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/13.0/pos_debt_notebook_sync/",
    "license": "Other OSI approved licence",  # MIT
    "price": 255.00,
    "currency": "EUR",
    "depends": ["base_automation", "pos_longpolling", "pos_debt_notebook"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/template.xml", "data/base_action_rule.xml"],
    "qweb": [],
    "demo": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": False,
    "installable": False,
    "demo_title": "Internal Credit System",
    "demo_addons": [],
    "demo_addons_hidden": [],
    "demo_url": "internal-credit-system",
    "demo_summary": "Organize your cash-free system for set of shops with a single payment point. E.g. at festivals, amusements parks, etc.",
    "demo_images": ["images/credit.png"],
}
