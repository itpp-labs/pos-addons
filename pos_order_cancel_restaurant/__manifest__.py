# -*- coding: utf-8 -*-
{
    "name": """Analyzing of refunds in Restaurant""",
    "summary": """Waiter specifies refund reason to avoid serving mistakes in future.""",
    "category": "Point of Sale",
    "images": ["images/pos_order_cancel_restaurant.png"],
    "version": "10.0.1.3.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://twitter.com/gabbasov_dinar",
    "license": "LGPL-3",
    "price": 50.00,
    "currency": "EUR",

    "depends": [
        "pos_order_cancel",
        "pos_restaurant_base",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
        "views/views.xml",
    ],
    'qweb': [
        'static/src/xml/cancel_order.xml',
    ],
    "demo": [
        'data/pos_cancelled_reason_demo.xml'
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
