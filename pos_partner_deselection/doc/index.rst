=====================
 Partner Deselection
=====================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

* Open menu ``[[ Point of Sale ]]``

  * Select a Point of Sale (POS)
  * Click on ``[More]`` at the right corner of this POS and then select  ``[Settings]`` inside a POS
  * Go to the ``Features`` section
  * Specify a **Customer Deselection Interval** in seconds
  * Click ``[Save]``

Usage
=====

* Open a Point of Sale (POS)
* Click ``Customer``
* Select a customer from the appeared List with all Customers (you can use search filed above)
* Click the ``Set Customer`` button
* Wait for an amount of time which you have predefined in the *Customer Deselection Interval* field
* RESULT: Customer has automatically deselected after Deselection Interval.
