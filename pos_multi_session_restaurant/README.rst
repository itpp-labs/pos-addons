.. image:: https://img.shields.io/badge/license-LGPL--3-blue.png
   :target: https://www.gnu.org/licenses/lgpl
   :alt: License: LGPL-3

========================
 Sync restaurant orders
========================

Syncs additional restaurant data:

* Table and floor
* Guests number
* Printer status (green "Order" button)
* Notes

Each multi-session and each unsynchronized POS may have its own floor set. POSes in multi-session have same floors.

FIXME: there is issue with floor real-time synchronization, to synchronize tables after modifying them it is mandatory to refresh all POSes pages, also deleting a table with open order on it leads to constant error messages. See https://github.com/it-projects-llc/pos-addons/issues/375.

Local run
---------

If you use dbfilter, don't forget to specify correct proxy on printers

Credits
=======

Contributors
------------
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

      To get a guaranteed support
      you are kindly requested to purchase the module
      at `odoo apps store <https://apps.odoo.com/apps/modules/12.0/pos_multi_session_restaurant/>`__.

      Thank you for understanding!

      `IT-Projects Team <https://www.it-projects.info/team>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/12.0

HTML Description: https://apps.odoo.com/apps/modules/12.0/pos_multi_session_restaurant/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Notifications on updates: `via Atom <https://github.com/it-projects-llc/pos-addons/commits/12.0/pos_multi_session_restaurant.atom>`_, `by Email <https://blogtrottr.com/?subscribe=https://github.com/it-projects-llc/pos-addons/commits/12.0/pos_multi_session_restaurant.atom>`_

Tested on Odoo 12.0 b05e34a0d9b13a1c6971b99ed3e5fa20199f3545
