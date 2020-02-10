===============================================
 Disable options in POS (restaurant extension)
===============================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Usage
=====

* Go to ``[Settings] >> Users`` menu

  * Open user form
  * Open **Point of Sale** tab
  * Uncheck ``[x] Allow change Qty for kitchen orders`` box
  * Uncheck ``[x] Allow remove kitchen order line`` box
  * Click ``[Save]``

* Go to ``[Point of Sale]`` menu
* Open POS session

  * Add products allowed to be sent to kitchen
  * Click ``[Order]``
  * RESULT: Disabled ``Qty`` button
  * Then set product quantity to ``0`` using ``Backspace`` button
  * RESULT: Once the qty equals to 0, ``Backspace`` button is disabled
