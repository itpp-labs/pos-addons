===============================
 Multi-session Synchronization
===============================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Usage
=====

In case you use second server, there might be an 'Access-Control-Allow-Origin' error. Your web server has to add additional header to response. Configuration for nginx may look as following::

        add_header 'Access-Control-Allow-Origin' * always;

To make your second server be able to process 'OPTIONS' method requests, nginx configuration has to consist following::

        if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,X-Debug-Mode';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
        }

In order to configure access to the server from other sources do the following:

* 1 Open menu ``Settings >> Activate the developer mode``
* 2 Open menu ``Settings >> Parameters >> System Parameters``
* 3 Click ``[Create]``

    * 3.1 Paste in the field **Key** 'pos_longpolling.allow_public'
    * 3.1 Paste in the field **Value** '1'

* 4 Click ``[Save]``
