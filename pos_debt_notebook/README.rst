Debt payment for POS (technical core)
=====================================

This addon add debt payment method for POS (debt notebook).

It implements as follows. Addon create payment method (Debt
journal). When customer buy on credit, he give "debt" to cashier,
which can be considered as some kind of money. This virtual money
(debts) is accounted just like usual money. But when customer pay
debts, this virtual money (debts) are moved from debt account to cash
(or bank) account

So, positive amount of debts (debit) means that customer have to
pay. Negative amount of debts (credit) means that customer overpay his
debts and can take instead some product or take back that money.

Screenshots
===========

Check images/ folder or open page https://apps.odoo.com/apps/modules/8.0/pos_debt_notebook/
