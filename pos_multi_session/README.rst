Sync POS orders across multiple sessions
========================================

The module allows to use multiple POS for handling orders. For example, order could be created in POS1, then new items will be added in POS2, then order would be paid in POS3.

Usage
=====

* open "Point of Sale/Configuration/Point of Sales"
  * create or open some "Point of Sale" record
  * set Multi-session value (create new one if needed)
  * set Multi-session for other "Point of Sale", which should be synced
* start POS session on all POSes
* start selling

Tested on Odoo 8.0 eed09ba4105ae8f47a37c5071217cea2ef2e153e
