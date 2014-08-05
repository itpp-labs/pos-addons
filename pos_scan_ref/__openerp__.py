{
    'name' : 'FIX searching product by ref in POS',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': """
By default, if you put ean13 barcode in "Internal Reference" in product form, then when you scan item in pos Odoo cannot find product.

This module fix this behaviour
    """,
    'depends' : ['point_of_sale'],
    'data':[
        'data.xml',
        ],
    'installable': True,
    'auto_install': False,
}
