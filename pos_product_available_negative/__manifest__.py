# Copyright 2016 Stanislav Krotov <https://it-projects.info/team/ufaks>
# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
{
    "name": 'Restrict out-of-stock POS Orders',
    'summary': 'Only supervisor can approve POS Order with out-of-stock product',
    "category": "Point Of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version=11.0",
    "images": [],
    "version": "12.0.1.1.1",
    "application": False,

    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_product_available_negative/",
    "license": "LGPL-3",
    "price": 50.00,
    "currency": "EUR",

    "depends": [
        "pos_pin",
        "pos_product_available",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        'data.xml',
        'views.xml',
    ],
    "demo": [
    ],
    "qweb": [
    ],

    'installable': True,
}
