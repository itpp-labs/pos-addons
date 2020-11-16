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
* `Stanislav Krotov <https://it-projects.info/team/ufaks>`__


Further information
===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/13.0/pos_product_available_negative/


Notifications on updates: `via Atom <https://github.com/it-projects-llc/pos_addons/commits/13.0/pos_product_available_negative.atom>`_, `by Email <https://blogtrottr.com/?subscribe=https://github.com/it-projects-llc/pos_addons/commits/13.0/pos_product_available_negative.atom>`_

Tested on `Odoo 12.0 <https://github.com/odoo/odoo/commit/53dcdd5a9e22429a9638f68674264436ce21e42b>`_
