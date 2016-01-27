{
    'name' : 'Custom Product barcode generator',
    'version' : '1.0.0',
    'author' : 'IT-Projects LLC, Ivan Yelizariev',
    'license': 'GPL-3',
    'category' : 'Point Of Sale',
    'website' : 'https://yelizariev.github.io',
    'description': """
Module introduce barcode sequences:

* To weight EAN13: 21xxxxxNNDDDC
* Internal EAN13: 240000xxxxxxC

Steps to use module:

* create new product or open existed one
* set value of field "To weight"
* click button "generate ean" and addon choose sequence based on "To weight" value and generate ean
    """,
    'depends' : ['point_of_sale', 'product_barcode_generator'],
    'data':[
        'data.xml',
        'views.xml',
        ],
    'installable': True,
    'auto_install': False,
}
