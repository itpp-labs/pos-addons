===================
 POS Discount base
===================

Technical module that applies some refactoring on built-in ``pos_discount`` module to allow easily extend its methods.

More details:

* method ``button_click`` is moved to OrderWidget with new name ``discount_button_click``.
* callback on confirming discount is a new method ``confirm_discount`` in OrderWidget 
* method ``apply_discount`` is moved to OrderWidget with the same name.

Credits
=======

Contributors
------------
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_discount_base/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 10.0 a63ecee47ac271b1f0a23528d9d5eab7f63ae528
