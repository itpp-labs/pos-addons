.. image:: https://img.shields.io/badge/license-LGPL--3-blue.png
   :target: https://www.gnu.org/licenses/lgpl
   :alt: License: LGPL-3

========================
 RFID adapter for POSes
========================

Converts RFID scan result to a proper value.

It's not possible to make similar module that depends on ``barcodes`` only, because in some cases there is no way to automatically detect shall code be translated or not. So in that cases we trigger several events: with original code and with translated ones.

Adapters
========

HEX to DEC
----------

E.g. ``167610E5 >> 0376836325``

Credits
=======

Contributors
------------
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

      To get a guaranteed support
      you are kindly requested to purchase the module
      at `odoo apps store <https://apps.odoo.com/apps/modules/10.0/pos_rfid/>`__.

      Thank you for understanding!

      `IT-Projects Team <https://www.it-projects.info/team>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_rfid/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Notifications on updates: `via Atom <https://github.com/it-projects-llc/pos-addons/commits/10.0/pos_rfid.atom>`_, `by Email <https://blogtrottr.com/?subscribe=https://github.com/it-projects-llc/pos-addons/commits/10.0/pos_rfid.atom>`_

Tested on Odoo 10.0 be689c53c13330832510c8cef332ac862d4ed5e8
