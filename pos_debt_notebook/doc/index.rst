==============================
 Debt/Credit notebook for POS
==============================

Installation
============

If you have open POS session after install the module close it and open new one.
After this a debt payment method will appear in the POS.

Usage
=====

Debt Journal
------------

* open POS
* add usual products
* select Customer
* on payment screen use "Debt Journal" to pay

Pay Full Debt button
--------------------

The button appears when you select Customer which has unpaid debt (red amount). You can see this button in 2 places: 

* At the top of the Customer's form
* On the payment page
 
When you click ``[Pay Full Debt]`` button, the debt amount will be added to the payment list with negative sign. That negative amount has to be covered by normal payment (e.g. by cash). After that the Customer will have zero debt value.

Credit Products
---------------

* Instead of using Debt Journal, customer can purchase *Credits* via *Credit Products*
* When you create *Credit product*, don't forget to set **Credit Product** field
* *Credit products* can be sold via POS and via invoices (including eCommerce). The later requires `another module <https://apps.odoo.com/apps/modules/10.0/pos_debt_notebook_sync/>`_ to notify POS about eCommerce sales, otherwise POS will get updates about invoices only after POS reloading.
* Note. Taxes on purchasing *Credit Products* are not supported. Taxes are applied on purchasings normal products.

Autopay credits
---------------

Journals with turned on option *Autopay* will be automatically added to payment lines if credit balance for the journal is positive.
If added payment lines fully cover the payment amount you will see additional buttons for payment proceeding

* *Validate* button on payment screen
* *Next* button on the receipt screen

In order to simplify and speed up a payment proceeding, those buttons located in the place of *Payment* button in pos.
After a successfully proceeded autopay a thumb up is shown on the screen.

Manual Credit Updates
---------------------

It can be used for different purposes:

* to setup initial debt / credit values
* for periodic import from another system
* to remove test debts

To use it

* open ``Point of sale >> Configuration >> Manual Credit Updates``
* create record or import csv, Excel file

Handling employees
------------------

Group of partner from the same Company can be handling together.

* Open wizard via ``Invoicing >> Sales >> Generate POS Credits Invoices``

  * Specify **Company**
  * Select **Credit Product** (create one if needed)
  * Select **Payment Type** -- way to compute **Credits to Add** for each employee
  * At employee list you can see **Current Credits** and check\edit **Credits to Add**
  * Click ``[Generate]``

* Open ``Invoicing >> Sales >>  Customer Invoices``
* Select Invoices for the same company
* Click ``[Action] -> Confirm Draft Invoices``
* Click ``[Action] -> Register Payment``
* Now Credits for employees are updated

Uninstallation
==============

Nothing special is needed to uninstall this module.
Debt data are still available after you re-install the module.
