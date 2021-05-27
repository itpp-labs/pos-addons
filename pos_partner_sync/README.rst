.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

.. image:: https://img.shields.io/badge/license-MIT-blue.svg
   :target: https://opensource.org/licenses/MIT
   :alt: License: MIT

======================
 Sync Partners in POS
======================

The module allows to instantly update partner data in opened POSes via longpolling connection if any of predefined partner fields have been changed in the backend.

By default, Odoo updates partner data when open the client list. This module doesn't require an extra action for that and updates partner data in POSes instantly after the predefined partner field has been modified.
So, for example, if you use only barcodes to choose clients, it helps to keep barcode data updated without opening the client list. You only need set **Barcode** field to be synchronized like it explained in `Configuration`

Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/13.0/pos_partner_sync/


Tested on `Odoo 13.0 <https://github.com/odoo/odoo/commit/b80321acd5553466862b5c2c56cff014765ecf99>`_
