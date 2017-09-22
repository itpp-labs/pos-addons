# -*- coding: utf-8 -*-
{
    "name": """POS Absolute and Relative Discounts""",
    "summary": """Provides absolute discounting for Point of Sale""",
    "category": "Point of Sale",
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info",
    "license": "LGPL-3",

    "depends": [
        "pos_discount",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        'views.xml',
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
