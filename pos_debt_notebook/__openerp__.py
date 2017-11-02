# -*- coding: utf-8 -*-
{
    'name': 'POS Debt & Credit notebook',
    'summary': 'Comfortable sales for your regular customers. Debt payment method for POS',
    'category': 'Point Of Sale',
    "images": ['images/debt_notebook.png'],
    'version': '4.4.0',

    'author': 'IT-Projects LLC, Ivan Yelizariev',
    "support": "apps@it-projects.info",
    'website': 'https://it-projects.info',
    'license': 'LGPL-3',
    "price": 280.00,
    "currency": "EUR",

    "external_dependencies": {"python": [], "bin": []},
    'depends': [
        'point_of_sale',
        'base_groupby_extra',
    ],
    'data': [
        'data/product.xml',
        'views.xml',
        'views/pos_debt_report_view.xml',
        'views/pos_credit_update.xml',
        'wizard/pos_credit_invoices_views.xml',
        'data.xml',
        'security/ir.model.access.csv',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    "demo": [
    ],
    'installable': False,
    'uninstall_hook': 'pre_uninstall',
}
