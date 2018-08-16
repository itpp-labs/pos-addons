# Copyright 2016 Stanislav Krotov <https://it-projects.info/team/ufaks>
# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
{
    "name": """Restrict out-of-stock POS Orders""",
    "summary": """{SHORT_DESCRIPTION_OF_THE_MODULE}""",
    "category": "Point Of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version={ODOO_BRANCH}",
    "images": [],
    "version": "11.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/yelizariev",
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

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,
    "uninstall_hook": None,

    "auto_install": False,
    "installable": True,

}
