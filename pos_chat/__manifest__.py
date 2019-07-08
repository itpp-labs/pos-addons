# -*- coding: utf-8 -*-
.{
    "version": "12.0.0.0.0",
    "name": """Pos_chat""",
    "summary": """Simple chat for simple users""",
    "category": "Point of Sale",
    # 'live_test_url': "",
    "images": [],
    "application": False,

    "author": "IT-Projects LLC, Safin Vildan",
    "website": "https://it-projects.info/team/yelizariev",
    "license": "LGPL-3",
    # 'price: 250.00,
    # 'currency: "EUR",g

    "depends": [],
    "external_dependencies": {"python": [], "bin": []},

    "data": [
        # 'security/ir.model.access.csv',
        "data/data.xml",
        "views/views.xml",
        "views/templates.xml",
    ],
    "qweb": [
        # 'static/src/xml/*.xml',
    ],
    "demo": [
        "demo/demo.xml"
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,

    "description": """Mudule allows users to chat with each other"""
}


