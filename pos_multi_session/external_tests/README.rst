
================
 External tests
================

To run tests, you need to run odoo server and then execute::

    cd pos_multi_session
    DATABASE=test_database python -m unittest discover

To run only one file::

    DATABASE=test_database python -m unittest discover -p test_sync.py

Odoo server
-----------

* run it with ``-d`` (``--database--``) parameter
* run it with default port
* run it with ``--test-enable``
* use database with demo data
* don't use ``--db-filter`` or make it equal to database name
