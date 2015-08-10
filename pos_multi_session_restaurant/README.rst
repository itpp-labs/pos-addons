Sync POS orders across multiple sessions (restaurant extension)
===============================================================

Allows to attach all synced orders to some (virtual) table.

It's usefull for canteens, that have tables with waiters as well as usual queue.

Usage
=====

* configure restaurant:

  * create floor
  * open POS

    * create tables
    * close POS

* Open POS form ("Point of Sale/Configuration/Point of Sales")

  * set "Virtual Table" at "Multi-session" section
  * click "Save"

Tested on Odoo 8.0 46abcabd0ac1f993dd8763c72945b0546c42bcb5 (from https://github.com/odoo-dev/odoo/tree/8.0-pos-backports-rescue-fva )
