.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

.. image:: https://img.shields.io/badge/license-MIT-blue.svg
   :target: https://opensource.org/licenses/MIT
   :alt: License: MIT

==========================
 POS: Out-of-stock orders
==========================

The module depends on the pos_pin module. Before POS order validation the module checks whether the order contains
products with no positive quantity. If it does then a cashier gets popup to select users. A sale is take place 
if the selected user has group which is specified in the POS config parameter "Negative Order Group". Otherwise
the sale is rejected.

Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* krotov@it-projects.info

Further information
===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/10.0/pos_product_available_negative/


Tested on `Odoo 10.0 <https://github.com/odoo/odoo/commit/e210faa676dfed82280e4a9c5618459a12abdfaa>`_
