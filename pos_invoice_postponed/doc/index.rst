===========================
 Postponed Invoices in POS
===========================


Configuration
=============

* `Activate developer mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Close the POS session for which you are setting up the Postponed Invoices, if it's active now.
* Open ``[[Point of Sale]] >> Configuration >> Payment Methods`` menu
* Choose a journal or create one, make sure the journal is active in POS
* Activate **Create Postponed Invoice** field


Usage
=====

* Go to ``[[Point of Sale]]`` menu
* Open POS session
* Pay an order with the configured `Payment Method`
* Go to ``[[Invoicing]] >> Customer Invoices`` menu
* RESULT: Created Invoice in state `Opened` without any payments
