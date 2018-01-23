# -*- coding: utf-8 -*-
{
    "name": """HR Partners Attendance""",
    "summary": """Manage partners attendances""",
    "category": "Human Resources",
    # "live_test_url": "",
    "images": [],
    "version": "1.0.0",
    "application": False,

    "author": "IT-Projects LLC, Kolushov Alexandr",
    "support": "apps@it-projects.info",
    "website": "https://it-projects.info/team/KolushovAlexandr",
    "license": "LGPL-3",
    # "price": 9.00,
    # "currency": "EUR",

    "depends": [
        'hr',
        'report',
        'barcodes'
    ],
    "external_dependencies": {"python": [], "bin": []},
    'data': [
        'security/hr_attendance_security.xml',
        'security/ir.model.access.csv',
        'views/web_asset_backend_template.xml',
        'views/hr_attendance_view.xml',
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
