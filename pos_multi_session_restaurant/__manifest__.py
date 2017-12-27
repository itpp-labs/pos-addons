# -*- coding: utf-8 -*-
{
    "name": """Sync restaurant orders""",
    "summary": """Staff get order details immediately after waiter taps on tablet""",
    "category": "Point of Sale",
    "live_test_url": 'http://apps.it-projects.info/shop/product/pos-multi-session?version=10.0',
    "images": ['images/s2.png'],
    "version": "2.1.1",
    "application": False,

    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@it-projects.info",
    "website": "https://yelizariev.github.io",
    "license": "LGPL-3",
    "price": 140.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant",
        "pos_multi_session",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/views.xml",
    ],
    "qweb": [
    ],
    "demo": [
        "demo/demo.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": True,
    "installable": True,
}
