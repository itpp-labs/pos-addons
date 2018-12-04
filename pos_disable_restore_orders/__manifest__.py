# -*- coding: utf-8 -*-
{
    'name': "Disable orders restoring",
    'version': '1.0.0',
    'author': 'Ivan Yelizariev',
    'category': 'Point Of Sale',
    "support": "pos@it-projects.info",
    'website': 'https://yelizariev.github.io',
    'depends': ['pos_disable_payment', 'bus'],
    'data': [
        'views.xml',
    ],
    'installable': False,
}
