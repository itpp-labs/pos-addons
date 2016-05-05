{
    'name': "Sync POS orders across multiple sessions (restaurant extension)",
    'version': '1.1.3',
    'author': 'Ivan Yelizariev',
    'category': 'Point Of Sale',
    'website': 'https://yelizariev.github.io',
    'depends': ['pos_restaurant', 'pos_multi_session','to_pos_shared_floor'],
    'data': [
        'views.xml',
        ],
    'demo': [
        'demo/demo.xml',
    ],
    'installable': True,
    'auto_install': True,
}
