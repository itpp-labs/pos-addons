=================
 Lock POS Screen
=================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Open menu ``[[ Point of Sale ]] >> Configuration >> Point of Sale``
* Choose the POS where you need the ability to lock the screen
* Enable `Login with Employees` and set `Allowed Employees` or you can leave this field blank

Setting auto-locking interval
-----------------------------

The last activity interval to activate the automatic screen lock. Zero if auto-locking is not needed

* Open menu ``[[ Point of Sale ]] >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click ``[Edit]``
  * Input in **Screen Auto-lock** a number of seconds before auto-locking. Zero if auto-locking is not needed
  * Click ``[Save]``

Setting **Badge ID** and/or **Security PIN** for login the POS
--------------------------------------------------------------

* Go to ``Employees``

  * Open user form
  * Open **HR Settings** tab
  * Set **Badge ID** and/or **Security PIN**

Usage
=====

The last activity interval to activate the automatic screen lock. Zero if autolocking is not needed

* Open menu ``[[ Point of Sale ]] >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click ``[Edit]``
  * Input in **Autolock** a number of seconds before autolocking. Zero if autolocking is not needed
  * Click ``[Save]``
