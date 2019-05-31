# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
{
    "name": """Multiple categories per product in POS""",
    "summary": """Specify as many categories for a product as you need""",
    "category": "Point of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version=12.0",
    "images": [],
    "version": "12.0.1.0.1",
    "application": False,

    "author": "IT-Projects LLC, Pavel Romanchenko",
    "support": "pos@it-projects.info",
    'website': 'https://www.odoo.com/apps/modules/12.0/pos_category_multi/',
    "license": "LGPL-3",
    "price": 15.00,
    "currency": "EUR",

    "depends": [
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "template.xml",
        "view.xml",
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

    # "demo_title": "{MODULE_NAME}",
    # "demo_addons": [
    # ],
    # "demo_addons_hidden": [
    # ],
    # "demo_url": "DEMO-URL",
    # "demo_summary": "{SHORT_DESCRIPTION_OF_THE_MODULE}",
    # "demo_images": [
    #    "images/MAIN_IMAGE",
    # ]
}
