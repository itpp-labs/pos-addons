{
    'name' : 'Product lot in POS',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://yelizariev.github.io',
    'images': ['images/screenshot.png'],
    'price': 6.00,
    'currency': 'EUR',
    'depends' : ['product_lot', 'pos_product_available'],
    'data':[
        'data.xml',
        ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
    'auto_install': True,
}
