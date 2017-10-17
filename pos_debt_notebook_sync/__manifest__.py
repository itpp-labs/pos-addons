# -*- coding: utf-8 -*-
{
    "name": """Internal Credit System""",
    "summary": """Credit payment system for festivals, food courts, etc.""",
    "category": "Point of Sale",
    'live_test_url': 'http://apps.it-projects.info/shop/product/internal-credit-system?version=10.0',
    "images": ['images/credit.png'],
    "version": "1.1.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    "price": 510.00,
    "currency": "EUR",

    "depends": [
        "base_action_rule",
        "pos_longpolling",
        "pos_debt_notebook",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
        "data/base_action_rule.xml",
    ],
    'qweb': [],
    "demo": [],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,

    "demo_title": "Internal Credit System",
    "demo_addons": [
    ],
    "demo_addons_hidden": [
    ],
    "demo_url": "internal-credit-system",
    "demo_summary": "Organize your cash-free system for set of shops with a single payment point. E.g. at festivals, amusements parks, etc.",
    "demo_images": [
        "images/credit.png",
        "static/description/icon.png",
        "static/description/fest.jpg",
        "static/description/credit_product.png",
        "static/description/credit_web.png",
        "static/description/customer_balance.png",
        "static/description/max_debt.png",
        "static/description/payment.png",
        "static/description/rfid.gif",
        "static/description/sync_pos.png",
        "static/description/balance_report.png",
        "static/description/credit_report-1.png",
        "static/description/credit_report-2.png",
        "static/description/credit_report.png",
        "static/description/debt_history.png",
        "static/description/debt_history-1.png",
    ]
}
