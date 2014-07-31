{
    'name' : 'Debt payment for POS (TG)',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': """
POS interface for debt notebook.

To make repayment of a debt create payment of another type (e.g., cash ). This payment should be more than total amount of current order (also, you can create empty order). After this click on debt button and validate. Now difference between payment and total is amount of returned money
    """,
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
# and  !widget.pos.get('selectedOrder').get_partner_id()
