Sync POS orders across multiple sessions (restaurant extension)
===============================================================
In new version tables syncing according to floors and table id.

In old vesion: Allows to attach all synced orders to some (virtual) table.
It's usefull for canteens, that have tables with waiters as well as usual queue.

Usage
=====

* configure restaurant:

  * create floor
  * open restaurant POS

    * create tables
    * close POS

Tested on Odoo 8.0 46abcabd0ac1f993dd8763c72945b0546c42bcb5 (from https://github.com/odoo-dev/odoo/tree/8.0-pos-backports-rescue-fva )
New version tested on Odoo 9 22e94f5254a35fc20ca536ed1b5e6a6cf315e4c4