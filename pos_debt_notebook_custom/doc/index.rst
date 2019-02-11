====================================================
 Extra Custom features for POS Debt Credit notebook
====================================================

Configuration
=============

Must-have product
-----------------

* Open menu ``[[ Point of Sale ]] >> Configuration >> Payment Methods``
* Select or create Journal where feature will be applied
* Navigate to *Advanced Settings* tab
* Set field **Must-have Product**

Note. It's supposed that you have only one *Must-have Product*. If you set *Must-have Product* for several journals, then after first purchase the button in POS is dissappeared.

Usage
=====

Must-have product
-----------------

* Open POS
* Select Customer with enough amount of credits to purchase the Must-Have Product two times
* Above Num Pad section you will see button "[Must-have product name]"
* Click button to add to the order
* Pay the order
* Select the same Customer again
* RESULT: the button is not visible as Customer purchased the product
* Select Customer without enough credits to purchase a single Must-Have Product
* RESULT: button is not visible as Customer doesn't have enough credits
