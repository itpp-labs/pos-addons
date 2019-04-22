============================
 Ask Manager to use journal
============================

Installation
============
* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way


Configuration
=============

Manager's PIN
-------------

Set a PIN for a POS manager as it's explained in `Confirm POS action by PIN` module
As Administrator do next:

Journal
-------

  * Open ``[[Point of Sale]] >> Payment Methods`` menu
  * Choose a journal or create one, be sure the journal is active in POS
  * Activate **Manager's Permission** field

Usage
=====

* Go to ``[[Point of Sale]]`` menu
* Open POS session

  * Click ``[Payment]``
  * Select and click a payment method with enabled **Manager's Permission** option
  * Select a manager from appeared list
  * Enter it's password
  * Click ``[Ok]``

* RESULT: Paymentline with selected payment method is added
