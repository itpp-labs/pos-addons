{
    'name' : 'Debt payment for POS (TG)',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': """
POS interface for debt notebook. Addon is based on **tg_pos_enhanced** and **pos_debt_notebook** addons

To make repayment of a debt create payment of another type (e.g., cash ). This payment should be more than total amount of current order (also, you can create empty order). After this click on debt button and validate. Now difference between payment and total is amount of returned money
    """,
    'depends' : ['tg_pos_enhanced', 'pos_debt_notebook'],
    'data':[
        'tg_data.xml',
        ],
    'qweb': [
        'static/src/xml/tg_pos.xml',
    ],
    #'js': [
    #    'static/src/js/tg_pos.js',
    #],
    #'css':[
    #    'static/src/css/tg_pos.css',
    #],
    'installable': True,
    'auto_install': True
}
# and  !widget.pos.get('selectedOrder').get_partner_id()
