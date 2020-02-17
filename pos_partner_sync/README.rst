.. image:: https://img.shields.io/badge/license-MIT-blue.svg
   :target: https://opensource.org/licenses/MIT
   :alt: License: MIT

======================
 Sync Partners in POS
======================

The module allows to instantly update partner data in opened POSes via longpolling connection if any of predefined partner fields have been changed in the backend.

By default, Odoo updates partner data when open the client list. This module doesn't require an extra action for that and updates partner data in POSes instantly after the predefined partner field has been modified.
So, for example, if you use only barcodes to choose clients, it helps to keep barcode data updated without opening the client list. You only need set **Barcode** field to be synchronized like it explained in `Configuration`

Credits
=======

Contributors
------------
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

      To get a guaranteed support you are kindly requested to purchase the module at `odoo apps store <https://apps.odoo.com/apps/modules/10.0/pos_partner_sync/>`__.

      Thank you for understanding!

      `IT-Projects Team <https://www.it-projects.info/team>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_partner_sync/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 10.0 d89f4d6ec26806389922351eb8e575754b3f60e0
