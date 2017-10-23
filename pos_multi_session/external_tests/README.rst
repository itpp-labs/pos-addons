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

    docker exec -u odoo -i -t odoo /bin/bash -c "export DATABASE=test_database; cd /mnt/addons/it-projects-llc/pos-addons/pos_multi_session; python -m unittest discover external_tests"

