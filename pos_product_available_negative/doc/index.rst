==================================
 Restrict out-of-stock POS Orders
==================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``[[Point of Sale]] >> Configuration >> Point of Sale``

  * Open POS config form
  * Click ``[Edit]``
  * Set **Negative Order Group**
  * Click ``[Save]``

Usage
=====

* Go to ``[[Point of Sale]] >> Dashboard``
  
  * Open POS session
  * Select a product with negative qty
  * Click ``Payment``
  * Click ``Validate``

RESULT: If the user doesn't belong to ``Negative Order Group``, the popup appears prompting to confirm the action by autorised user
