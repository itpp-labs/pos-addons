# Copyright 2016 Stanislav Krotov <https://it-projects.info/team/ufaks>
# Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# License MIT (https://opensource.org/licenses/MIT).
{
    "name": "POS: Out-of-stock orders",
    "summary": "Only supervisor can approve POS Order with out-of-stock product",
    "category": "Point Of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version=13.0",
    "images": [],
    "version": "13.0.1.1.1",
    "application": False,
    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/13.0/pos_product_available_negative/",
    "license": "Other OSI approved licence",  # MIT
    "price": 25.00,
    "currency": "EUR",
    "depends": ["pos_pin", "pos_product_available"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["data.xml", "views.xml"],
    "demo": [],
    "qweb": [],
    "installable": False,
}
