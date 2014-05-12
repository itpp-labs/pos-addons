{
    'name' : 'Debt payment for POS',
    'version' : '1.0.0',
    'author' : 'Ivan Yelizariev',
    'category' : 'Point Of Sale',
    'website' : 'https://it-projects.info',
    'description': """
This addon add debt payment method for POS (debt notebook).

It implements as follows. Addon create payment method (Debt journal). When customer buy on credit, he give "debt" to cashier, which can be considered as some kind of money. This virtual money (debts) is accounted just like usual money. But when customer pay debts, this virtual money (debts) are moved from debt account to cash (or bank) account

So, positive amount of debts (debit) means that customer have to pay. Negative amount of debts (credit) means that customer overpay his debts and can take instead some product or take back that money.
    """,
    'depends' : ['account', 'point_of_sale'],
    'data':[
        'data.xml',
        'views.xml',
        ],
    'installable': True
}
