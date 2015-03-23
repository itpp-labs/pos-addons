{
    'name' : 'Debt notebook for POS',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://yelizariev.github.io',
    'depends' : ['pos_debt_notebook', 'point_of_sale'],
    'data':[
        'tg_data.xml',
        ],
    'qweb': [
        'static/src/xml/tg_pos.xml',
    ],
    'installable': True,
    'auto_install': True
}
