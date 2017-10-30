Sync POS orders across multiple sessions
========================================

The module provides instant orders data synchronization between POSes related to a common multi session.

All work data is stored on server. Module 'Sync Server for POS orders' is responsible for server part of synchronization processing,
also it's provides a possibility to store data on a separated Sync Server.
Separate sync server synchronization provides uninterrupted synchronization in case of main server is shut down.
Longpolling provides instant updates between POSes in a multi session.
Offline POS is only able to create new orders, after connecting a POS back, data will be synchronized.
POSes are able to work without synchronization, like without the module.

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