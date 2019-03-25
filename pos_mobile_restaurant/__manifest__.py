{
    "name": """POS Mobile UI for Waiters""",
    "summary": """Your Restaurant in the Mobile Version""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/pos-mobile-ui?version=12.0",
    "images": ["images/pos_mobile_restaurant.png"],
    "version": "12.0.1.3.8",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_mobile_restaurant/",
    "license": "LGPL-3",
    "price": 100.00,
    "currency": "EUR",

    "depends": [
        "pos_restaurant_base",
        "pos_mobile",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/pos_mobile_restaurant_template.xml",
        "views/pos_mobile_restaurant_view.xml",
    ],
    "qweb": [
        "static/src/xml/pos.xml",
    ],
    "demo": [
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": True,
    "installable": True,
}
