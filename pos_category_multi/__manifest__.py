# Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
# Copyright 2019 Anvar Kildebekov <https://it-projects.info/team/fedoranvar>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).

{
    "name": """Multiple categories per product in POS""",
    "summary": """Specify as many categories for a product as you need""",
    "category": "Point of Sale",
    "version": "11.0.1.1.1",
    "images": [],
    "author": "IT-Projects LLC, Pavel Romanchenko",
    "support": "pos@it-projects.info",
    "website": "https://it-projects.info",
    "license": "AGPL-3",
    "price": 15.00,
    "currency": "EUR",

    "depends": [
        'point_of_sale',
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        'template.xml',
        'view.xml',
    ],
    "demo": [],
    "installable": True,
    "auto_install": False,

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": 'copy_categories',
    "uninstall_hook": None,

}
