===================================
 Keyboard support in Point Of Sale
===================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way
* Configure POS Longpolling (pos_longpolling) module as it's explained `here <https://apps.odoo.com/apps/modules/10.0/pos_longpolling/>`__

Usage
=====

* Open POS session
* Change user

  * Go to ``[Users] ``
  * Choose your user
  * Enter PIN code in the apperead Pop-up keyboard
  
    * You can use ``Backspace`` if you want to delete symbol
    * You can use ``Enter`` if you want to confirm PIN code
    * You can use ``Esc`` if you want to close the Pop-up keyboard
  
  * Work in your own account using hotkeys for each mode on the Numpad or just press Extra keys. Then enter numbers.
  
    * You can use ``/`` or ``q`` in case of Qrt mode
    * You can use ``-`` or ``d`` in case of Disc mode
    * You can use ``*`` or ``p`` in case of Price mode
    * You can use ``+`` or ``s`` in case of +/- 

RESULT: In opened POS Keyboard support is invoked instantly and available for further work without any extra action.
