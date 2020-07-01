================================
 Inventory Adjustments over POS
================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Go to ``Point of Sale >> Configuration >> Point of Sale``

  * Open POS configuration form
  * Click ``[Edit]``
  * Check **[x] Inventory Adjustment Mode** box under ``Inventory Adjustment`` section

Usage
=====

Create Invenory Adjustment
--------------------------

* Open ``Inventory >> Inventory Adjustments`` menu
* Click ``[Create]``
* Set the fields:

  * **Inventory Reference**
  * Inventory of **Staged**

* Click ``[Save]``
* Click ``[Start Inventory]``

POS
---

* Open POS session
* Click ``[New Stage]`` to create a new stage

  * Select an Inventory
  * Select an User
  * Type a Name
  * Type a Note (optionally)

* Click ``[Ok]``
* Add products to POS cart
* Set a quantity required to adjust
* Click ``[Validate]``

RESULT: the inventory stage is added in backend to the selected Inventory record
