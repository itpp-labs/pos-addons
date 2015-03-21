{
    'name' : 'Available quantity of products in POS',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category': 'Point Of Sale',
    'website' : 'https://yelizariev.github.io',
    'price': 9.00,
    'currency': 'EUR',
    'depends' : ['point_of_sale', 'stock'],
    'data':[
        'data.xml',
        ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
}
