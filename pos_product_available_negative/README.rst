.. image:: https://img.shields.io/badge/license-MIT-blue.svg
   :target: https://opensource.org/licenses/MIT
   :alt: License: MIT

==================================
 Restrict out-of-stock POS Orders
==================================

The module depends on the pos_pin module. Before POS order validation the module checks whether the order contains
products with no positive quantity. If it does then a cashier gets popup to select users. A sale is take place 
if the selected user has group which is specified in the POS config parameter "Negative Order Group". Otherwise
the sale is rejected.

Credits
=======

Contributors
------------
* krotov@it-projects.info

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_product_available_negative/

Usage instructions: `<doc/index.rst>`__

Changelog: `<doc/changelog.rst>`__

Tested on Odoo 10.0 e210faa676dfed82280e4a9c5618459a12abdfaa
