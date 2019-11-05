# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2017,2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    "name": """Sync Server for POS orders""",
    "summary": """Sync orders via main or separate (e.g. local) server""",
    "category": "Point of Sale",
    # "live_test_url": 'http://apps.it-projects.info/shop/product/pos-multi-session?version=12.0',
    "images": [],
    "version": "12.0.1.0.6",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_multi_session_sync/",
    "license": "LGPL-3",
    "price": 60.00,
    "currency": "EUR",

    "depends": [
        "pos_longpolling",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/ir.model.access.csv"
    ],
    "qweb": [
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
