===============
 {Module name}
===============

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Usage
=====
In case you use second server, there might be an 'Access-Control-Allow-Origin' error. Try to write next code below each line contains proxy_pass in the Nginx configuration file::

        add_header 'Access-Control-Allow-Origin' * always;

