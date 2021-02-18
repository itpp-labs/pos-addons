# Copyright 2018 Artyom Losev
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """POS: Pay SO & Invoices""",
    "summary": """Handle the payment process for Sale Orders/Invoices over Point of Sale""",
    "category": "Point of Sale",
    "images": ["images/pos_invoice_pay_main.png"],
    "version": "11.0.1.2.4",
    "application": False,
    "author": "IT-Projects LLC, Artyom Losev",
    "support": "help@itpp.dev",
    "website": "https://apps.odoo.com/apps/modules/11.0/pos_invoice_pay",
    "license": "Other OSI approved licence",  # MIT
    "depends": ["base_automation", "sale_management", "pos_longpolling"],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "data.xml",
        "actions/base_action_rules.xml",
        "report/report.xml",
        "view.xml",
    ],
    "qweb": ["static/src/xml/pos.xml"],
    "demo": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": False,
    "installable": True,
}
