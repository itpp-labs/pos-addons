# Copyright 2014 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2021 Denis Mudarisov <https://github.com/trojikman>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """POS: Total discount""",
    "summary": """Simple way to apply discount for all order items""",
    "category": "Point of Sale",
    "images": [],
    "version": "13.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@itpp.dev",
    "website": "https://apps.odoo.com/apps/modules/13.0/pos_discount_total/",
    "license": "Other OSI approved licence",  # MIT
    "price": 15.00,
    "currency": "EUR",
    "depends": ["point_of_sale"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["data.xml"],
    "demo": [],
    "qweb": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
}
