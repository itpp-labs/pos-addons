===================================
 Keyboard support in Point Of Sale
===================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Usage
=====

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

Also inside the Pop-ups windows you can use ``Enter``, ``Backspace`` and ``Esc`` keys in order to speed up the process of interaction with the System.


=========== ===================== ==================
Key         Pop-up                Action
=========== ===================== ==================
Backspace    ``<-``               delete symbol
----------- --------------------- ------------------
Enter        ``Ok``               confirmation
----------- --------------------- ------------------
Esc          ``Cancel``           close Pop-up 
=========== ===================== ==================

User Scenario
-------------
* Open menu ``[[ Users ]]``
* Choose a User with PIN code
* Enter PIN code with the keyboard

  * You can use ``Backspace`` if you want to delete symbol
  * You can use ``Enter`` if you want to confirm PIN code
  * You can use ``Esc`` if you want to close the Pop-up keyboard
  
* Work in your own account using hotkeys for each mode on the Numpad or just press Extra keys. Then enter numbers.
  
  * You can use ``/`` or ``q`` in case of Qrt mode
  * You can use ``-`` or ``d`` in case of Disc mode
  * You can use ``*`` or ``p`` in case of Price mode
  * You can use ``+`` or ``s`` in case of +/- 

RESULT: In opened POS Keyboard support is invoked instantly and available for further work without any extra action.
