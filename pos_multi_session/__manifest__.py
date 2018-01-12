
{
    "name": """Sync POS orders across multiple sessions""",
    "summary": """Use multiple POS for handling orders""",
    "category": "Point Of Sale",
    "images": ["images/pos-multi-session.png"],
    "version": "4.0.0",
    "application": False,

    "author": "IT-Projects LLC, Ivan Yelizariev",
    "support": "apps@it-projects.info",
    "website": "https://yelizariev.github.io",
    "license": "LGPL-3",
    "price": 160.00,
    "currency": "EUR",

    "depends": [
        "pos_disable_payment",
        "pos_multi_session_sync"
    ],
    "external_dependencies": {"python": [], "bin": []},
    "data": [
        "security/ir.model.access.csv",
        "views/pos_multi_session_views.xml",
        "multi_session_view.xml"
    ],
    "qweb": [
        "static/src/xml/pos_multi_session.xml",
    ],
    "demo": [
        "demo/demo.xml",
    ],

    "post_load": None,
    "pre_init_hook": None,
    "post_init_hook": None,

    "auto_install": False,
    "installable": True,
}
