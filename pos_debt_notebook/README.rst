==============================
Debt notebook (technical core)
==============================

Debt payment method for POS.

The module creates a payment method (Debt journal). When a customer buys on credit, he gives
"debt" to a cashier, which can be considered as some kind of money. This virtual money (debts) is accounted
just like ordinary money. But when the customer pays debts, this virtual money (debts) are moved from debt account
to cash (or bank) account.

So, positive amount of debts (debit) means that the customer have to pay. Negative amount of debts
(credit) means that the customer has overpaid his debts and can take instead some product or take back that money.

Usage
=====

Credits
=======

Contributors
------------
* krotov@it-projects.info

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`_

Further information
===================

HTML Description: https://apps.odoo.com/apps/modules/9.0/pos_debt_notebook/

Tested on Odoo 9.0 9cdc40e3edf2e497c4660c7bb8d544f750b3ef60
