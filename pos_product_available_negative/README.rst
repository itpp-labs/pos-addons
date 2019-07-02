.. image:: https://img.shields.io/badge/license-LGPL--3-blue.png
   :target: https://www.gnu.org/licenses/lgpl
   :alt: License: LGPL-3

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

<<<<<<< HEAD
Demo: http://runbot.it-projects.info/demo/pos_addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/pos_product_available_negative/

Usage instructions: `<doc/index.rst>`_
=======
Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_product_available_negative/
>>>>>>> 3490d116... :green_heart: correct versions

Changelog: `<doc/changelog.rst>`_

Notifications on updates: `via Atom <https://github.com/it-projects-llc/pos_addons/commits/11.0/pos_product_available_negative.atom>`_, `by Email <https://blogtrottr.com/?subscribe=https://github.com/it-projects-llc/pos_addons/commits/11.0/pos_product_available_negative.atom>`_

<<<<<<< HEAD
Tested on Odoo 11.0 97dbb8c6af4c6af0622497b276bdfb40ee0a3215
=======
Tested on Odoo 10.0 e210faa676dfed82280e4a9c5618459a12abdfaa
>>>>>>> 3490d116... :green_heart: correct versions
