Sync POS orders across multiple sessions (restaurant extension)
===============================================================
Tables syncing according to floors and table id.

It's usefull for canteens, that have tables with waiters as well as usual queue.

Usage
=====

* configure restaurant:

  * create floor
  * open restaurant POS

    * create tables
    * close POS

* Open restaurant POS (not a queue POS) in "Point of Sale/Configuration/Point of Sales"
  * set "Virtual Table" at "Multi-session" section

Tested on Odoo 9 22e94f5254a35fc20ca536ed1b5e6a6cf315e4c4