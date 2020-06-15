# Copyright 2018 Artyom Losev
# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2018 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

{
    "name": """Pay Expenses over POS""",
    "summary": """Pay HR expenses over Point of Sale""",
    "category": "Point of Sale",
    # "live_test_URL": "",
    "images": ["images/pay_exp1.jpg"],
    "version": "11.0.1.0.0",
    "application": False,
    "author": "IT-Projects LLC, Artyom Losev",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/ArtyomLosev",
    "license": "LGPL-3",
    "price": 89.00,
    "currency": "EUR",
    "depends": ["hr_expense", "base_automation", "pos_longpolling",],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_expenses_view.xml",
        "views/pos_expenses_template.xml",
        "views/report.xml",
        "views/assets_demo.xml",
        "data/base_action_rule.xml",
    ],
    "qweb": ["static/src/xml/pos.xml",],
    "demo": [],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,
    "auto_install": False,
    "installable": True,
}
