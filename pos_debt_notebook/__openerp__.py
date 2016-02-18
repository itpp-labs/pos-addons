{
    'name': 'Debt notebook (technical core)',
    'version': '2.0.0',
    'author': 'IT-Projects LLC, Ivan Yelizariev',
    'summary': 'Debt payment method for POS',
    'license': 'LGPL-3',
    'category': 'Point Of Sale',
    'website': 'https://it-projects.info',
    'depends': ['point_of_sale', 'account'],
    'demo': [
        'test/account_minimal_test.xml',
        ],
    'data': [
        'data.xml',
        'views.xml',
        ],
    'installable': True,
    'post_init_hook': 'init_debt_journal',
}
