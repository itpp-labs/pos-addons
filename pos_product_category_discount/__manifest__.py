{
    "name": """POS Discount Programs""",
    "summary": """Use predefined discount programs for products in POS""",
    "category": "Point of Sale",
    # "live_test_url": 'http://apps.it-projects.info/shop/product/pos-product-category-discount?version=12.0',
    "images": ['images/dp3.png'],
    "version": "12.0.1.2.7",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "pos@it-projects.info",
    "website": "https://apps.odoo.com/apps/modules/12.0/pos_product_category_discount/",
    "license": "LGPL-3",
    "price": 39.00,
    "currency": "EUR",

    "depends": [
        "pos_discount",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "views/template.xml",
        "views/view.xml",
        "security/ir.model.access.csv",
    ],
    "qweb": [
        "static/src/xml/DiscountProgram.xml",
    ],
    "demo": [
        "data/pos_product_category_discount_demo.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,

    "demo_title": "POS Discount Programs",
    "demo_addons": [
    ],
    "demo_addons_hidden": [
    ],
    "demo_url": "pos-product-category-discount",
    "demo_summary": "Use predefined discount programs for products in POS",
    "demo_images": [
        "images/dp3.png",
    ]
}
