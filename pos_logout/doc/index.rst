=================
 Lock POS Screen
=================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Usage
=====

* Go to ``[Settings] >> Users`` menu

  * Open user form
  * Open **Point of Sale** tab
  * Set **Barcode** and/or **Security PIN**

* Go to ``[Point of Sale]`` menu

  * Open POS session
  * Click on User name at the top of POS screen
  * Click the ``Logout`` icon - the screen is locked
  * Tap the screen to unlock it
  * Select a user
  * Scan user barcode or select manually to input security PIN
  * RESULT:
    If the barcode/PIN is correct, POS screen is unlocked. Otherwise you will see the warning "Incorrect Password".

Screen Autolock
---------------

The last activity interval to activate the automatic screen lock. Zero if autolocking is not needed

* Open menu ``[[ Point of Sale ]] >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click ``[Edit]``
  * Input in **Autolock** a number of seconds before autolocking. Zero if autolocking is not needed
  * Click ``[Save]``
