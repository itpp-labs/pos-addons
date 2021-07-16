.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

======================
 POS: Prepaid credits
======================

The module allows to make sale on credit.

Debt (Credit) value is changed whenever:

* Product marked as "Credit Product" is sold via POS or via Invoices. Invoices created via website_sale (eCommerce) module are supported too.
* POS payment is made via journal marked as "Debt journal"
* "Manual Credit Updates" is added

Other features:

* each user has Debt Limit field. By default is 0, i.e. user has to pay in advance and cannot have negative credits amount.
* Working with employees of company. You can get a sum of Credits of all employess of any company. You can make invoices per each employee at once to updates their Credits.

Installation \ Deinstallation
=============================

* Debt data are still available after the module will be re-installed.
* When new (first after install) POS session is opened, a debt payment method would added in a POS config.
* If the module was install and uninstall immediately (without created POS sessions) then it keeps no data.   
* If a user deleted debt journal from POS config manually then after the module is upgraded 
  POS config would not be changed. 
* Multicompany mode is supported

Roadmap
=======

* TODO. Field ``journal_id`` in ``pos.credit.update`` model should be replaced with ``pos_payment_method_id = fields.Many2on('pos.payment.method')``

* TODO. New option for **Zero transactions** feature: allow to create extra order line with negative amount instead of applying discounts. 

  * It creates extra record in accounting system (pos.order.line). It can be used as a backup for *Manual Updates*
  * It works with following problem case:
  
    In case of purchasing products with taxes not included in the price, such journals cannot be used along with normal payments

* TODO. Improvements on heavy usage (Many POSes, Many Partners)

  * Num of users with cached Debt History must be limited
  * Limit issue in ``reload_debts`` (check FIXME note there)
  * Many POSes do the same requests on getting updates from longpolling. Solution:
  
    * Customizable timeout in ``on_debt_updates`` method in ``pos_debt_notebook_sync`` module.
    * ``reload_debts`` called with ``"postpone": false`` must ignore existing timer

Questions?
==========

To get an assistance on this module contact us by email :arrow_right: help@itpp.dev

Contributors
============
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__
* `Stanislav Krotov <https://it-projects.info/team/ufaks>`__
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

Further information
===================

Odoo Apps Store: https://apps.odoo.com/apps/modules/14.0/pos_debt_notebook/


Tested on `Odoo 14.0 <https://github.com/odoo/odoo/commit/c28a32daa56193d97f0d91dac1fe560603b8837b>`_
