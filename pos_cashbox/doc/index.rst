===========================
 Open CashBox from Backend
===========================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click ``[Edit]``
  * Specify IP address for ``Hardware Proxy / PosBox``
  * Check the **[x] Cashdrawer** box
  * Check the **[x] Cash Control** box
  * Click ``[Save]``

Usage
=====

* Go to ``Point of Sale >> Orders >> Sessions``

  * Open POS session form
  * Check that the session state is ``Opening Control`` or ``Closing Control``
  * Click on ``Open CashBox``

RESULT: Cashbox is opened
