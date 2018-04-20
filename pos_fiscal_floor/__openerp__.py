# -*- coding: utf-8 -*-
{
    "name": """POS fiscal floor""",
    "summary": """Add Fiscal Position to POS floor model""",
    "category": "Point Of Sale",
    # "live_test_url": "",
    "images": [],
    "version": "10.0.1.0.1",
    "application": False,

    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/yelizariev",
    "license": "LGPL-3",

    "depends": [
        "pos_restaurant",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views.xml",
    ],
    "qweb": [
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,
}
