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
* configure nginx to handle ``/longpolling/poll`` requests (no needed if you use docker instruction above)
* Add following System Parameter:

  * Key: ``pos_multi_session.allow_external_tests``
  * Value: ``1``

Run Odoo
========
if you don't use docker instruction above:

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

    docker exec -u odoo -i -t odoo /bin/bash -c "\
    cd /mnt/addons/it-projects-llc/pos-addons/pos_multi_session; \
    python -m unittest discover -t . -s external_tests"


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

Run tests for separated servers
===============================

To run tests on separated servers do what is written in previous paragraphs and create one docker more. This docker will process functionality of main server while 'odoo' container will provide synchronization.
::

    docker run \
    -e DB_PORT_5432_TCP_ADDR=db_ms_test \
    --network=multi_session_test_network \
    -p 8069:8069 \
    -p 8072:8072 \
    -e ODOO_MASTER_PASS=admin \
    -e DATABASE=db_test_odoo_main \
    -e ODOO_DOMAIN=odoo-nginx \
    -e ODOO_PORT=8069 \
    -v /PATH/TO/pos-addons/:/mnt/addons/it-projects-llc/pos-addons/ \
    -v /PATH/TO/odoo/:/mnt/odoo-source/ \
    --name odoo-main \
    -t itprojectsllc/install-odoo:10.0-dev -- --workers=1 -d db_test_odoo_main --db-filter db_test_odoo_main

To install necessary modules and configure them type in address bar localhost:$PORT. Run these sessions strictly in different browsers to prevent data base addressation confusing
In 'odoo' container set parameter pos_longpolling.allow_public with value '1' like it was for pos_multi_session.allow_external_tests
Next in 'odoo-nginx' container modify nginx configuration file etc/nginx/nginx.conf as represented below:::

        if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,X-Debug-Mode';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
        }
        add_header 'Access-Control-Allow-Origin' * always;

Copy-paste it into the beginning of each ``location { }`` block except ``location ~* /web/static/``
It makes your second server be able to process 'OPTIONS' method requests and prevent 'Access-Control-Allow-Origin' errors.

Do not forget to restart your 'odoo-nginx' container after all steps.
