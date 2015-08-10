Sync POS orders across multiple sessions
========================================

The module allows to use multiple POS for handling orders. For example, order could be created in POS1, then new items will be added in POS2, then order would be paid in POS3.

Usage
=====

* be sure, that your odoo instance support longpolling, i.e. Instant Messaging works
* open "Point of Sale/Configuration/Point of Sales"

  * create or open some "Point of Sale" record
  * set Multi-session value (create new one if needed)
  * untick "Allow Payments" if current POS is used only to create orders
  * set Multi-session for other "Point of Sale", which should be synced
* start POS session on all POSes, i.e.

  * login as user1 on computer1
  * start session on POS1
  * login as user2 on computer2
  * start session on POS2
  * etc
* start selling

Tested on Odoo 8.0 46abcabd0ac1f993dd8763c72945b0546c42bcb5 (from https://github.com/odoo-dev/odoo/tree/8.0-pos-backports-rescue-fva )
