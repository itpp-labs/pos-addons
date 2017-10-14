===============
 {Module name}
===============

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Usage
=====
In case you use second server, there might be an 'Access-Control-Allow-Origin' error. Your web server has to add additional header to response. Configuration for nginx may look as following::

        add_header 'Access-Control-Allow-Origin' * always;

