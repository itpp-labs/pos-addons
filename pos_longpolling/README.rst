.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

==========================
 POS: Longpolling support
==========================

Technical module to implement instant updates in POS

Debugging
=========

If you need to see longpolling requests at browser's Network tool, be sure that you don't have other opened tab to the same address. Otherwise, odoo smartly sends longpolling requests via one of existing tabs only and pass result via ``localStorage``.

Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__
* `Alexandr Kolushov <https://it-projects.info/team/KolushovAlexandr>`__
* `Eugene Molotov <https://it-projects.info/team/em230418>`__

Sponsors
========

* `EST-POS OÜ <https://www.estpos.ee>`__

===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/14.0/pos_longpolling/


Tested on `Odoo 14.0 <https://github.com/odoo/odoo/commit/05c373a99a6064f08fc9eb0662ab2ccdb1978cd7>`_
