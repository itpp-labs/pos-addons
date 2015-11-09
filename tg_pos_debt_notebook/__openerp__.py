{
    'name': 'Debt notebook for POS',
    'version': '1.0.3',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'GPL-3',
    'category': 'Point Of Sale',
    'website': 'https://yelizariev.github.io',
    'depends': ['pos_debt_notebook', 'point_of_sale'],
    'images': [
        'images/screenshot-2.png',
        'images/screenshot-3.png',
        'images/screenshot-1.png',
        ],
    'data': [
        'tg_data.xml',
        ],
    'qweb': [
        'static/src/xml/tg_pos.xml',
    ],
    'installable': True,
    'auto_install': True,
}
