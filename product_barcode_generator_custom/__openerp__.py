{
    'name' : 'Custom Product barcode generator',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': """
Module introduce barcode sequences:

* To weight EAN13: 21xxxxxNNDDDC
* Internal EAN13: 240000xxxxxxC

    """,
    'depends' : ['point_of_sale', 'product_barcode_generator'],
    'data':[
        'data.xml',
        ],
    'installable': True,
    'auto_install': False,
}
