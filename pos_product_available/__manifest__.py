{
    "name": """Available quantity of products in POS""",
    "summary": """Adds available quantity at products in POS""",
    "category": "Point Of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version={ODOO_BRANCH}",
    "images": [],
    "version": "12.0.1.0.6",
    "application": False,

    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_product_available/",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        'point_of_sale',
        'stock',
    ],
    "external_dependencies": {"python": [], "bin": []},
    'data': [
        'data.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
}
