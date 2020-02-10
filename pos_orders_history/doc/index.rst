====================
 POS Orders History
====================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way
* `Activate longpolling <https://odoo-development.readthedocs.io/en/latest/admin/longpolling.html>`__

Configuration
=============

* Go to ``Point of Sale >> Configuraion >> Point of Sale`` menu
* Open POS configuration form
* Click ``[Edit]``
* See the options:

  * ``[x] Orders History`` - to activate/deactivate ``History`` button
  * ``[x] Orders of last 'n' days`` - to display orders for ``n`` days
  * ``[x] Number of days`` - the number of ``n`` days
  * ``[x] Show Cancelled Orders`` - to display cancelled orders together with paid orders
  * ``[x] Show Posted Orders`` - to display posted orders together with paid orders
  * ``[x] Show Barcode on Receipt`` - to display the barcode on payment receipt

* Click ``[Save]``

Usage
=====

* Go to ``Point of Sale`` menu
* Open POS session
* Click on ``History``
* RESULT: all paid orders list are displayed
