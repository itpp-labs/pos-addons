Sync POS orders across multiple sessions
========================================

The module synchronize orders data between POSes related to a common multi session. Longpolling provides instant updates between POSes in a multi session.

All work data is stored on server. Offline POS is only able to create new orders, after connecting a POS back, data will be synchronized.

POSes are able to work without synchronization, like without the module.

Tests: `<external_tests/README.rst>`__

Tested on Odoo 10.0 5a3c43b480b404ca660fe2b0860e0a1572c08017
