.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

==================================
 Restrict out-of-stock POS Orders
==================================

The module depends on the pos_pin module. Before POS order validation the module checks whether the order contains
products with no positive quantity. If it does then a cashier get popup with selection users. A sale is take place 
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

Odoo Apps Store: https://apps.odoo.com/apps/modules/9.0/pos_product_available_negative/


Tested on `Odoo 9.0 <https://github.com/odoo/odoo/commit/9cdc40e3edf2e497c4660c7bb8d544f750b3ef60>`_
