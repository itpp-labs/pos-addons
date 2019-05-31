==================
 Merge POS Orders
==================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click on ``[Edit]``
  * Check **[x] Order Merge** box under ``Bar & Restaurant`` section

Usage
=====

* Open POS session
* Create new order and add a product
* Create another order and add a product
* Click ``[Join]``
* Click on the table that contains the orders
* Select the order(s)
* Click ``[Join]``
RESULT: The order has been merged to the initial one
