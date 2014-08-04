{
    'name' : 'Product lot',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': """
Modules allows to create product which is a set of some product (e.g. box of 100 units of same product). Such product can be splitted
    """,
    'depends' : ['product', 'stock'],
    'data':[
        'views.xml',
        ],
    'installable': True,
    'auto_install': False,
}
