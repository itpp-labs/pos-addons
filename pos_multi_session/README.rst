Sync POS orders across multiple sessions
========================================

The module provides instant orders synchronization between POSes related to a common *multi session*.

Server side of synchronization is handled by module ``pos_multi_session_sync``. The role of *Sync Server* may have same odoo server as well as separate odoo server (e.g. server in local network).

Instant data exchange are made via built-in longpolling feature extended by ``pos_longpolling`` module.

When POS becomes offline, i.e. don't have connection to *Sync Server*, it is only able to create new orders and not allowed to modify exising orders to avoid synchronization problems.

Some POSes may be configured to work without synchronization. In such case it will work just like without the module.

Credits
=======

Contributors
------------
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/11.0

HTML Description: https://apps.odoo.com/apps/modules/11.0/pos_multi_session/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tests: `<external_tests/README.rst>`__

Tested on Odoo 11.0 88ccc406035297210cadd5c6278f6f813899001e
