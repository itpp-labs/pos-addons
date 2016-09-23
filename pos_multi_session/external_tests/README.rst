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
    pip2 install pyTelegramBotAPI

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
* not use ``--workers``
