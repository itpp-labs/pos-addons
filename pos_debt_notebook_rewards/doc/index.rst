==================================================
 Rewards for shifts in POS Debt & Credit notebook
==================================================


Configuration
=============

Access rights
-------------

In order to set access rights for users

* Open menu ``[[ Settings ]] >> Users``
* Click on required user
* Click ``Edit`` and set field **Reward Attendance**

    * ``Read-Only`` may see menu *Attendance Rewards*
    * ``Officer`` has access to create, update and deleting *Attendance Rewards* records
    * ``Manager`` like Officer, but also has access to *Reward types* menu

All those access levels have ``Read-Only`` access to the *Attendances* model.

In order to set access rights to **Attendance** for users follow instruction of `Partner Attendances <https://apps.odoo.com/apps/modules/10.0/base_attendance/>`_ module


Usage
=====

Reward Type
-----------

To create *Reward Type* you should have a debt/credit journal at first, then

* Open menu ``[[ Partner Attendances ]] >> Reward Types``
* Specify field **Name**
* Choose appropriate **Journal**
* Type a value to field **Reward amount**
* Click ``Save``

Attendance Rewards
------------------

Be aware that reward amount is fixed value and not depend on amount of attendee time.
To create *Attendance Rewards* record

* Open menu ``[[ Partner Attendances ]] >> Attendance Rewards``
* Click ``Create``
* Fill fields **Partner**, **Reward type** with a suitable data. To fill **Partner** you can just scan his barcode
* Field **Attendances** is automatically filled with appropriate partner attendances, you may choose which ones to reward
* Saving and Confirmation

    * Click ``Save`` to save the record im model without confirmation (in state draft)
    * Click ``Confirm`` to save the record and confirm reward action

Field **Note** is automatically filled with the chosen **Reward type**


Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way
