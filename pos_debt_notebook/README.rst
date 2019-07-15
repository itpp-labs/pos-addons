==============================
 Debt/Credit notebook for POS
==============================

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

Credits
=======

Contributors
------------
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__
* `Stanislav Krotov <https://it-projects.info/team/ufaks>`__
* `Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>`__
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/12.0

HTML Description: https://apps.odoo.com/apps/modules/12.0/pos_debt_notebook/

Usage instructions: `<doc/index.rst>`__

Changelog: `<doc/changelog.rst>`__

Tested on Odoo 12.0 b05e34a0d9b13a1c6971b99ed3e5fa20199f3545
