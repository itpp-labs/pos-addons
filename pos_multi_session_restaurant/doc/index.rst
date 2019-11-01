=================================================================
 Sync POS orders across multiple sessions (restaurant extension)
=================================================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

After adding a POS into a multi-session, update its floor set, because it might be changed according to a multi-session floors

A floor can be added to a multi-session by two ways:

* Via multi-session form:

  * Open ``[[ Point of Sale ]] >> Configuration >> Multi-session Settings``
  * Click on necessary multi-session
  * Choose or add a new floor in the ``Restaurant Floors`` field

* Default method: Add floor to POS belonging to necessary multi-session via ``[[ Point of Sale ]] >> Configuration >> Point of sale``

Local run
---------

If you use dbfilter, don't forget to specify correct proxy on printers

Usage
=====

* Open two or more POSes belongs to the multi-session
* In the first POS add a product
* In both POSes you will see the product in order list and underline note signifying that it was added by the first POS. At this time the number of the order is being changed from ``NEW`` to a number
* In the second POS click on the orderline and click a number by using numpad to change quantity of that product
* In both POSes you will see the changed quantity of the product and information about the orderline was added by the first and changed by the second POSes
