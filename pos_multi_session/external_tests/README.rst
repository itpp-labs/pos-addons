================
 External tests
================

Install Dependencies
====================

If you don't use dockers:

* Install phantomjs `2.0.0+ <https://github.com/ariya/phantomjs/commit/244cf251cd767db3ca72d1f2ba9432bda0b0ba7d>`__ ::

    wget https://gist.github.com/julionc/7476620/raw/e8f36f2a2d616720983e8556b49ec21780c96f0c/install_phantomjs.sh
    sed -i 's/phantomjs-1.9.8/phantomjs-2.1.1/' install_phantomjs.sh
    # check script before running.
    less install_phantomjs.sh
    bash install_phantomjs.sh

* Update python library::

    pip2 install -U requests
    pip2 install 'requests[security]'

Docker
======

* use *-dev* images of `install-odoo <https://github.com/it-projects-llc/install-odoo>`__, e.g. ``itprojectsllc/install-odoo:10.0-dev``

::

    docker network create multi_session_test_network

    docker run --network=multi_session_test_network -d -e POSTGRES_USER=odoo -e POSTGRES_PASSWORD=odoo --name db_ms_test postgres:9.5


    docker run \
    -e DB_PORT_5432_TCP_ADDR=db_ms_test \
    --network=multi_session_test_network \
    -e ODOO_MASTER_PASS=admin \
    -e DATABASE=test_database \
    -e ODOO_DOMAIN=odoo-nginx \
    -v /PATH/TO/pos-addons/:/mnt/addons/it-projects-llc/pos-addons/ \
    -v /PATH/TO/odoo/:/mnt/odoo-source/ \
    --name odoo \
    --link db_ms_test:db \
    -t itprojectsllc/install-odoo:$ODOO_BRANCH-dev -- --workers=1 -d test_database --db-filter test_database


    docker run \
    -p 8080:80 \
    --name odoo-nginx \
    --network=multi_session_test_network \
    -t itprojectsllc/docker-odoo-nginx

* Note. Name ``odoo`` for docker container is mandatory for nginx container and cannot be changed

Prepare Odoo
============

* in file ``addons/point_of_sale/static/src/js/gui.js`` comment out following line ::

    self.close_other_tabs();

* in file ``addons/bus/static/src/js/bus.js`` replace ::

      if(typeof Storage !== "undefined"){
          bus.bus = new CrossTabBus();
      } else {
          bus.bus = new bus.Bus();
      }

  with the following code: ::

      bus.bus = new bus.Bus();

* use database with demo data
* configure nginx to handle ``/longpolling/poll`` requests
* Add following System Parameter:

  * Key: ``pos_multi_session.allow_external_tests``
  * Value: ``1``

Run Odoo
========

* set ``-d`` (``--database``) parameter
* use default port
* set ``--db-filter``  equal to database name
* set ``--workers=1``

Run tests
=========

To run tests, you need to run odoo server and then execute::

    cd pos_multi_session
    DATABASE=test_database python -m unittest discover -t . -s external_tests 

To run only one file::

    DATABASE=test_database python -m unittest discover -t . -s external_tests -p test_sync.py

Run tests in Docker
-------------------
::

    docker exec -u odoo -i -t odoo /bin/bash -c "cd /mnt/addons/it-projects-llc/pos-addons/pos_multi_session; python -m unittest discover -t . -s external_tests"


Run tests in browser
====================

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
