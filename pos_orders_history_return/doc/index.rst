===================
 POS Orders Return
===================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``Point of Sale >> Configuraion >> Point of Sale`` menu
* Open POS configuration form
* Click ``[Edit]``
* Check ``[x] Orders History`` box
* Check ``[x] Return Orders`` box to activate order returns
* Check ``[x] Show Returned Orders`` box to display all previously returned orders
* Click ``[Save]``

Usage
=====

* Go to ``Point of Sale`` menu
* Open POS session
* Click ``History``
* Select an order
* Click ``Return``
* RESULT: the order opens in Return Mode with the products it contains

No Receipt Return
-----------------

* Click ``History``
* Click ``No Receipt``
* RESULT: the order opens in Return mode with all products

Search by Receipt Barcode
-------------------------

* Click ``History``
* Take a receipt
* Scan the receipt barcode
* RESULT: it automatically selects the order and opens it in Return mode
