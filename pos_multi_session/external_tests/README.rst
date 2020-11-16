.. image:: https://itpp.dev/images/infinity-readme.png
   :alt: Tested and maintained by IT Projects Labs
   :target: https://itpp.dev

================
 External tests
================

Install PhontomJS
-----------------

* Install phantomjs `2.0.0+ <https://github.com/ariya/phantomjs/commit/244cf251cd767db3ca72d1f2ba9432bda0b0ba7d>`__ ::

    wget https://gist.github.com/julionc/7476620/raw/e8f36f2a2d616720983e8556b49ec21780c96f0c/install_phantomjs.sh
    sed -i 's/phantomjs-1.9.8/phantomjs-2.1.1/' install_phantomjs.sh
    # check script before running.
    less install_phantomjs.sh
    bash install_phantomjs.sh

Update python library::

    pip2 install -U requests
    pip2 install 'requests[security]'

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
* use ``--db-filter`` it equal to database name
* use ``--workers=0``

Run tests in browser
--------------------

You can try repeat test in real browser, though it's not very convenient

* open odoo with localhost:8069
* open POS interface
* copy-paste code from ``pos_multi_session/external_tests/tests/inject.js``
* line-by-line copy-paste test js code from ``pos_multi_session/external_tests/tests/test_sync.py``, e.g.

  * in admin window::

        console.log('test_10_new_order');
        mstest.remove_all_orders();

  * in demo window::

        mstest.remove_all_orders();

  * in admin window::

        mstest.fill_order();

  * etc.

