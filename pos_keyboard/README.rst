===================================
 Keyboard support in Point Of Sale
===================================

The module allows to apply the usual keyboard (not the virtual one) in the Point of Sale.

Usage
------

Using hotkeys below switch to mode you need. Qty mode is used by default.
Then use keys with numbers to enter quantity, price or discount.
If you want to reset the amount of product to zero or delete them you can use ``Backspace`` .


=========== ===================== =================
Type        Numpad                Extra keys  
=========== ===================== =================
mode qty    ``/``                 ``q``
----------- --------------------- -----------------
mode disc   ``-``                 ``d``
----------- --------------------- -----------------
mode price  ``*``                 ``p``
----------- --------------------- -----------------
+/-         ``+``                 ``s``
=========== ===================== =================

Also inside the Pop-up keyboard you can use ``Enter``, ``Backspace`` and ``Esc`` keys in order to speed up the process of entering PIN-code.


=========== ===================== ===================== 
Key         Pop-up keyboard       Action
=========== ===================== =====================
Backspace    ``<-``               delete symbol
----------- --------------------- ---------------------
Enter        ``Ok``               confirm PIN
----------- --------------------- ---------------------
Esc          ``Cancel``           close Pop-up keyboard 
=========== ===================== =====================


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

      To get a guaranteed support you are kindly requested to purchase the module at `odoo apps store <https://apps.odoo.com/apps/modules/10.0/pos_keyboard/>`__.

      Thank you for understanding!

      `IT-Projects Team <https://www.it-projects.info/team>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_keyboard/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tested on Odoo 10.0 78ba90d54826c2ba11626e9a89b142964db25e2f
