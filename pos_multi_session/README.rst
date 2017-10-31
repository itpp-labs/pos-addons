Sync POS orders across multiple sessions
========================================

The module provides instant orders synchronization between POSes related to a common *multi session*.

Server side of synchronization is handled by module ``pos_multi_session_sync``. The role of *Sync Server* may have same odoo server as well as separate odoo server (e.g. server in local network).

Instant data exchange are made via built-int longpolling feature extended by ``pos_longpolling`` module.

When POS becomes offline, i.e. don't have connectiont *Sync Server*, it is only able to create new orders and not allowed to modify exising orders to avoid synchronization problems.

Some POSes may be configured to work without synchronization. It such case it will work just like without the module.

Credits
=======

Contributors
------------
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_multi_session/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tests: `<external_tests/README.rst>`__

Tested on Odoo 10.0 33a04354eb2b3897035c7206411fa0130b312313
