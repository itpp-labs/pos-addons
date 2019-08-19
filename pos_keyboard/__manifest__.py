# Copyright 2015 igallyamov <https://github.com/igallyamov>
# Copyright 2016 ufaks <https://github.com/ufaks>
# Copyright 2016-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
# Copyright 2018 Ruslan Ronzhin <https://it-projects.info/team/rusllan>
# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/kolushovalexandr>
# Copyright 2019 Anvar Kildebekov https://it-projects.info/team/fedoranvar>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).
{
    "name": """Keyboard support in Point Of Sale""",
    "summary": """Module allows to use usual keyboard (not virtual one) in Point of Sale""",
    "category": "Point Of Sale",
    # "live_test_url": "http://apps.it-projects.info/shop/product/DEMO-URL?version={ODOO_BRANCH}",
    "images": ['images/keyboard.png'],
    "version": "12.0.1.1.5",
    "application": False,

    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/yelizariev",
    "license": "LGPL-3",

    "price": 15.00,
    "currency": "EUR",

    "depends": [
        "point_of_sale",
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "data.xml"
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
