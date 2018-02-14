# -*- coding: utf-8 -*-
{
    "name": """POS Orders History Reprint""",
    "summary": """Reprint paid POS Orders with POS interface.""",
    "category": "point_of_sale",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Losev Artyom",
    "support": "apps@it-projects.info",
    "website": "",
    "license": "LGPL-3",

    "depends": [
        "pos_orders_history",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/ir.model.access.csv",
        "views/template.xml",
    ],
    "qweb": [
        "static/src/xml/main.xml"
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}