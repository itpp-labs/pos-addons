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


Local run
---------

If you use dbfilter, don't forget to specify correct proxy on printers

Tested on Odoo 9 4f7d0da94204dc6685c87cbfc675a7c38039aee5
