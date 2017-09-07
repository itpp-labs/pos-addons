Sync POS orders across multiple sessions
========================================

POSes are able to work without synchronization. Different in behavior: each new order is immediately given a number. Avoid including unsynchronized POSes to multi session with mutually unclosed sessions. It may leads to temporary order numbers mixing.

Tests: `<external_tests/README.rst>`__

Tested on Odoo 10.0 5a3c43b480b404ca660fe2b0860e0a1572c08017
