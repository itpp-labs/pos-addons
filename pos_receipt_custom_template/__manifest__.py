# Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """Customizable POS Receipt""",
    "summary": """Customize POS receipt view to your taste""",
    "category": "Point of Sale",
    # "live_test_url": "",
    "images": ["images/pos_receipt_custom_main.png"],
    "version": "12.0.1.0.2",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_receipt_custom_template/",
    "license": "LGPL-3",
    "price": 49.00,
    "currency": "EUR",

    "depends": [
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/view.xml",
        "views/template.xml",
        "security/ir.model.access.csv",
        "data/data.xml",
    ],
    "demo": [
    ],
    "qweb": [
        "static/src/xml/pos.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,
}
