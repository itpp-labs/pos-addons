# -*- coding: utf-8 -*-
{
    "name": """Partners Attendance""",
    "summary": """Manage partners attendances""",
    "category": "Extra Tools",
    # "live_test_url": "",
    "images": [],
    "version": "10.0.1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        'report',
        'barcodes'
    ],
    "external_dependencies": {"python": [], "bin": []},
    'data': [
        'security/res_attendance_security.xml',
        'security/ir.model.access.csv',
        'views/web_asset_backend_template.xml',
        'views/res_attendance_view.xml',
        'report/res_partner_badge.xml',
        'views/res_config_view.xml',
    ],
    'demo': [
    ],
    'qweb': [
        "static/src/xml/attendance.xml",
    ],
    'installable': True,
    'auto_install': False,
}
