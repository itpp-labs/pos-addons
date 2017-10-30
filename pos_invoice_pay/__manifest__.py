# -*- coding: utf-8 -*-
{
    "name": """POS Invoice Pay""",
    "summary": """Paying invoiceable Sales Orders and confirmed Invoies over Point of Sale""",
    "category": "pos",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Artyom Losev",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info",
    "license": "LGPL-3",

    "depends": [
        "account",
        "base_action_rule",
        "bus",
        "point_of_sale",
        "sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "data.xml",
        "actions/ir_action_server.xml",
        "actions/base_action_rules.xml",
        "report/report.xml"
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
}
