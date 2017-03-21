# -*- coding: utf-8 -*-
{
    "name": """Sync POS orders across multiple sessions""",
    "summary": """Use multiple POS for handling orders""",
    "category": "Point Of Sale",
    "images": ["images/pos-multi-session.png"],
    "version": "3.0.2",
    "application": False,

    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@it-projects.info",
    "website": "https://yelizariev.github.io",
    "license": "LGPL-3",
    "price": 160.00,
    "currency": "EUR",

    "depends": [
        "pos_disable_payment",
        "pos_longpolling",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/ir.model.access.csv",
        "views.xml",
    ],
    "qweb": [
        "static/src/xml/pos_multi_session.xml",
    ],
    "demo": [
        "demo/demo.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
