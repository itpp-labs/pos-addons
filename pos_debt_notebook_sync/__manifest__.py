# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).
# License OPL-1 (https://www.odoo.com/documentation/user/13.0/legal/licenses/licenses.html#odoo-apps) for derivative work.

{
    "name": """Internal Credit System""",
    "summary": """Credit payment system for festivals, food courts, etc.""",
    "category": "Point of Sale",
    "images": ["images/credit.png"],
    "version": "13.0.1.1.2",
    "application": False,
    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@itpp.dev",
    "website": "https://apps.odoo.com/apps/modules/13.0/pos_debt_notebook_sync/",
    "license": "OPL-1",
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
    "installable": True,
}
