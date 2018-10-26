{
    "name": """Print tweets with PosBox""",
    "summary": """Print tweets with specific hashtags""",
    "category": "Point of Sale",
    # "live_test_URL": "",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Dinar Gabbasov",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/GabbasovDinar",
    "license": "LGPL-3",
    # "price": 0.00,
    # "currency": "EUR",

    "depends": [
    ],
    "external_dependencies": {"python": ["twython", "escpos"], "bin": []},
    "data": [
    ],
    "qweb": [
    ],
    "demo": [
    ],

    "post_load": "post_load",
    "pre_init_hook": None,
    "post_init_hook": 'post_init',

    "auto_install": False,
    "installable": False,
}
