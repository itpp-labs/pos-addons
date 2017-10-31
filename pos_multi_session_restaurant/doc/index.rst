=================================================================
 Sync POS orders across multiple sessions (restaurant extension)
=================================================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

A floor can be added to a multi-session by two ways:

* Via multi-session form:

    * Open ``[[ Point of Sale ]] >> Configuration >> Multi-session Settings``
    * Click on a necessary multi-session
    * In the field ``Restaurant Floors`` chose or add a new floor

* Default method: Add floor via ``[[ Point of Sale ]] >> Configuration >> Point of sale`` to a POS that belongs to a necessry multi-session

Usage
=====

* Open two or more POSes belongs to the multi-session
* In the first POS add a product
* In both POSes you will see the product in order list, note in the line that it was added by the first POS and that the number of the order was changed from ``NEW`` to a number
* In the second POS click on the line with the product in the order list and click a number on the numpad under orderlist to change quantity of that product
* In both POSes you will see a changed quantity of the product and that this order line was added by first and changed by the second POSes
