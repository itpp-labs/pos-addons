======================
 Sync Partners in POS
======================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way
* Configure POS Longpolling (pos_longpolling) module as it's explained `here <https://apps.odoo.com/apps/modules/10.0/pos_longpolling/>`__

Configuration
=============

* Go to ``[Point of Sale] >> Configuration >> Settings``
* Set **Synchronized Fields**

Usage
=====

* For example set **Barcode** field to be synchronized
* Open POS session
* Open backend in another browser window

  * Go to ``[Sales] >> Sales >> Customers``
  * Open the customer form you selected above
  * Change the barcode

RESULT: In opened POS UI the customer data is updated instantly without any extra action
