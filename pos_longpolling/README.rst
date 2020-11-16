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
* gabbasov@it-projects.info

Further information
===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/10.0/pos_longpolling/


Tested on `Odoo 10.0 <https://github.com/odoo/odoo/commit/0cc09c773570d992d1fb3559e0d80acae3127ac7>`_
