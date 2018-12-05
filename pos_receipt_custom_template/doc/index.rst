==========================
 Customizable POS Receipt
==========================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Open menu ``[[ Point Of Sale ]] >> Configuration >> Point of Sale``

  * Open POS config form
  * At ``Hardware Proxy / PosBox`` section

    * Check **[x] Receipt Printer** box
    * Check **[x] Custom PosBox Receipt** box
    * Select ``Custom PosBox Receipt Template``
    
  * At ``Receipt`` section

    * Check **[x] Custom** box
    * Select ``Custom Template``

Usage
=====

* Open POS session

  * Add a product
  * Click ``[Payment]``
  * Select payment method
  * Click ``[Validate]``

RESULT: The ticket on receipt screen has customized view according to the template selected

* Then click ``[Print Receipt]``

RESULT: The printed receipt has customized view too
