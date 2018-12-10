=================================
 Customizable POS Kitchen Ticket
=================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Usage
=====

* Open menu ``[[ Point of Sale ]]>> Configuration >> Order Printers``

  * Click ``[Create]`` or edit an existing one
  * Check the box **[x] Custom Order Receipt**
  * Select ``Print Template`` or create new one
  * Click ``[Save]``

* Open POS session
* Add a product
* Click ``[Order]``

RESULT: The Order Receipt has been printed in the format selected

Note
====

Custom Qweb name for order receipt template (``t-name``) must be unique.
