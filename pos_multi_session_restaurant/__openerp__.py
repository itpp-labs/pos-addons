{
    'name': "Sync POS orders across multiple sessions (restaurant extension)",
    'version': '1.0.1',
    'summary': """Use multiple POS for handling orders""",
    'author': 'Ivan Yelizariev',
    'category': 'Point Of Sale',
    'images': ['images/pos-multi-session-rest.png'],
    'website': 'https://yelizariev.github.io',
    'price': 30.00,
    'currency': 'EUR',
    'depends': ['pos_restaurant', 'pos_multi_session','to_pos_shared_floor'],
    'data': [
        'views.xml',
        ],
    'installable': True,
    'auto_install': True,
}
