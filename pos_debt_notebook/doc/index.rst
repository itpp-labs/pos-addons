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
* We recommend a module that force user to login before making purchase on website, e.g. `website_sale_require_login <https://www.odoo.com/apps/modules/10.0/website_sale_require_login/>`_
* Note. Taxes on purchasing *Credit Products* are supported for purchasing via invoices (including eCommerce), but not for sales via POS. For taxed Credit Products in invoices only untaxed amount is added to credit amount.

Allow to cash out credits
-------------------------

* Go to ``Point of sale >> Configuration >> Payment Methods``

  * Open journal form
  * On ``Pont of Sale`` tab check the box ``Allow to cash out credits``

RESULT: By using journals with this option partners will be able to exchange their credits to cash in POS

  
Autopay credits
---------------

Journals with turned on option *Autopay* will be automatically added to payment lines if credit balance for the journal is positive.
If added payment lines fully cover the payment amount you will see additional buttons for payment proceeding

* *Validate* button on payment screen
* *Next* button on the receipt screen

In order to simplify and speed up a payment proceeding, those buttons located in the place of *Payment* button in pos.
After a successfully proceeded autopay a thumb up is shown on the screen.

Zero transactions
-----------------

* Go to ``Point of sale >> Configuration >> Payment Methods``

  * Open journal form
  * On ``Pont of Sale`` tab check the box ``Zero transactions``

RESULT: Discount the order (mostly 100%) when a user pay via such type of journal in POS

Manual Credit Updates
---------------------

It can be used for different purposes:

* to setup initial debt / credit values
* for periodic import from another system
* to remove test debts

To use it

* open ``Point of sale >> Configuration >> Manual Credit Updates``
* create record or import csv, Excel file

Zero transactions
-----------------

A special type of debt journals. Applies discounts corresponding to amount of payment. It creates *Manual Credit Updates* instead of accounting transactions. It can be used for bonuses, volunteer rewards and other cases when you don't work with real money. Notes:

* For such journals option **Allow to cash out credits** cannot be activated
* In case of purchasing products with taxes not included in the price, such journals cannot be used along with normal payments

To use it

* Open ``Point of sale >> Configuration >> Payment Methods``
* Create or select a required record
* Turn on the **Zero transactions** option

Handling employees
------------------

Group of partner from the same Company can be handling together.

* Open wizard via ``Invoicing >> Sales >> Pay for company's employees``

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

Writing off partner credits
---------------------------

Two update types:

    * Balance Update - Write-off certain amount from each partner
    * New Balance - Set the same new balance for all partners and write-off excessive credit amount from each partner

* Open wizard via ``Invoicing >> Sales >> Write-off Credits``

  * Specify **Update Type**. There are two update types:

    * Balance Update - Write-off certain amount from each partner
    * New Balance - Set the same new balance for all partners and write-off excessive credit amount from each partner

  * Specify **Write-off Amount** or **New Balance**
  * Select **Journal**
  * Select **Product** this product will be used in created invoices
  * Choose Partners for writing off
  * Click ``[Generate]``

* Now Partner Credits are updated

Uninstallation
==============

Nothing special is needed to uninstall this module.
Debt data are still available after you re-install the module.
