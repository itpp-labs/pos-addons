=================
 POS Longpolling
=================

Technical module to implement instant updates in POS

Debugging
=========

If you need to see longpolling requests at browser's Network tool, be sure that you don't have other opened tab to the same address. Otherwise, odoo smartly sends longpolling requests via one of existing tabs only and pass result via ``localStorage``.

Credits
=======

Contributors
------------
* gabbasov@it-projects.info

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_longpolling/

Usage instructions: `<doc/index.rst>`__

Changelog: `<doc/changelog.rst>`__

Tested on Odoo 10.0 0cc09c773570d992d1fb3559e0d80acae3127ac7
