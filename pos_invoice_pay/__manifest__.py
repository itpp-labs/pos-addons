# -*- coding: utf-8 -*-
# Copyright 2017 Artyom Losev
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """Pay Sale Orders & Invoices over POS""",
    "summary": """Handle the payment process for Sale Orders/Invoices over Point of Sale""",
    "category": "Point of Sale",
    "live_test_url": "http://apps.it-projects.info/shop/product/pos-invoice-pay?version=10.0",
    "images": ["images/pos_invoice_pay_main.png"],
    "version": "10.0.1.0.2",
    "application": False,

    "author": "IT-Projects LLC, Artyom Losev",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/ArtyomLosev",
    "license": "LGPL-3",
    "price": 89.00,
    "currency": "EUR",

    "depends": [
        "account",
        "base_action_rule",
        "bus",
        "point_of_sale",
        "sale",
        "pos_longpolling"
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "data.xml",
        "actions/ir_action_server.xml",
        "actions/base_action_rules.xml",
        "report/report.xml",
        "views.xml",
    ],
    "qweb": [
        'static/src/xml/pos.xml'
        ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,

    "demo_title": "Pay Sale Orders & Invoices over POS",
    "demo_addons": [
    ],
    "demo_addons_hidden": [
    ],
    "demo_url": "pos-invoice-pay",
    "demo_summary": "Handle the payment process for Sale Orders/Invoices over Point of Sale",
    "demo_images": [
        "images/pos_invoice_pay_main.png",
    ]
}
