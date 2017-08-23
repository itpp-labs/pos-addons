=====================
 POS restaurant base
=====================

Technical module in POS.

The standard Printer class in pos_restaurant/static/src/js/multiprint.js does not allow you to override the functions of this class.
This module duplicate the Printer class, computeChanges, printChanges, hasChangesToPrint functions from Order class and allows you to redefine them.

Credits
=======

Contributors
------------
* Dinar Gabbasov <gabbasov@it-projects.info>

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_restaurant_base/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 10.0 9e159ef2048574d179a9afb2226397e962aa5725
