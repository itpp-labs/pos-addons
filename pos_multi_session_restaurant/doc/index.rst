=================================================================
 Sync POS orders across multiple sessions (restaurant extension)
=================================================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

Adding a Floor
--------------

* Open menu ``Point of Sale``
* Click ``Configuration >> Floor Plans``
* Click ``[Create]``
* Paste a name for a floor in the field **Floor Name**
* Pick ``Background Color`` in RGB format.
* Click ``[Save]``

Adding a table
--------------

* Open menu ``Point of Sale``
* Click ``Configuration >> Floor Plans``
* Chose a floor you want to add a table on
* Click ``[Edit]``
* In the table click ``[Add an item]`` to add a table on the floor or chose a presence table to modify

    * Paste a table name in the field ``Table Name``
    * Paste number of seats in the field ``Seats``
    * Configure a table appearance below or make it on the floor plan after opening a POS session this table belongs to.

* Click ``[Save & Close]`` to save and return to the floor configuration
* Click ``[Save & New]`` to save and create a new table

Usage
=====

After opening a POS it is possible to add or modify tables by clicking a pencil button in the up-right corner below button ``[Close]``