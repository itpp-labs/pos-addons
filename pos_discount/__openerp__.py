{
    'name' : 'Discount for total amount of pos order',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': """
click on summary line of pos order and input discount value
    """,
    'depends' : ['point_of_sale'],
    'data':[
        'data.xml',
        ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'installable': True,
    'auto_install': True
}
