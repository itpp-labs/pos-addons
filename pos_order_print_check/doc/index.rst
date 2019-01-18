=========================
 Check PosBox Connection
=========================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Open menu ``[[ Point Of Sale ]] >> Configuration >> Point of Sale``
* Open POS Config form
* Click ``[Edit]``
* Specify ``PosBox`` settings at **Hardware Proxy / PosBox** section
* Click ``[Save]``

Usage
=====

* Open session of ``Point of Sale``
* Add some Products to cart
* Click ``[Order]``
* RESULT: if no connection to PosBox, you will see the warning message **No connection to the printer: printer_name**
