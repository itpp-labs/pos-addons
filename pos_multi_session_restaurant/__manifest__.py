# Copyright 2017 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
# Copyright 2017-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
# Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": """Sync restaurant orders""",
    "summary": """Staff get order details immediately after waiter taps on tablet""",
    "category": "Point of Sale",
    # "live_test_url": 'http://apps.it-projects.info/shop/product/pos-multi-session?version=12.0',
    "images": ["images/s2.png"],
    "version": "12.0.3.3.3",
    "application": False,
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@itpp.dev",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_multi_session_restaurant/",
    "license": "Other OSI approved licence",  # MIT
    "depends": ["pos_restaurant_base", "pos_multi_session"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/views.xml"],
    "qweb": [],
    "demo": ["demo/demo.xml"],
    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "auto_install": True,
    "installable": True,
}
