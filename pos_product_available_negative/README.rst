.. image:: https://img.shields.io/badge/license-LGPL--3-blue.png
   :target: https://www.gnu.org/licenses/lgpl
   :alt: License: LGPL-3

==================================
 Restrict out-of-stock POS Orders
==================================

The module depends on the pos_pin module. Before POS order validation the module checks whether the order contains
products with no positive quantity. If it does then a cashier get popup with selection users. A sale is take place
if the selected user has group which is specified in the POS config parameter "Negative Order Group". Otherwise
the sale is rejected.

Credits
=======

Contributors
------------
* `Stanislav Krotov <https://it-projects.info/team/ufaks>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

      To get a guaranteed support
      you are kindly requested to purchase the module
      at `odoo apps store <https://apps.odoo.com/apps/modules/11.0/pos_product_available_negative/>`__.

      Thank you for understanding!

      `IT-Projects Team <https://www.it-projects.info/team>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos_addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/pos_product_available_negative/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Notifications on updates: `via Atom <https://github.com/it-projects-llc/pos_addons/commits/11.0/pos_product_available_negative.atom>`_, `by Email <https://blogtrottr.com/?subscribe=https://github.com/it-projects-llc/pos_addons/commits/11.0/pos_product_available_negative.atom>`_

Tested on Odoo 11.0 97dbb8c6af4c6af0622497b276bdfb40ee0a3215
