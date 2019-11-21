===============================
 POS Payments by Manager's PIN
===============================

Installation
============
* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way


Configuration
=============

Manager's PIN
-------------

Set a PIN for a POS manager as it's explained in `Confirm POS action by PIN <https://apps.odoo.com/apps/modules/10.0/pos_pin/>`_  module.
As Administrator please follow next scenario:

Journal
-------

  * `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
  * Open ``[[Point of Sale]] >> Payment Methods`` menu
  * Choose a journal or create one, be sure the journal is active in POS
  * Activate **Manager's Permission** field

Usage
=====

* Go to ``[[Point of Sale]]`` menu
* Open a POS session

  * Click ``[Payment]``
  * Select and click a payment method with enabled **Manager's Permission** option
  * Select a POS manager from the appeared list
  * Enter his/her password
  * Click ``[Ok]``

* RESULT: Payment line with selected payment method is added.
