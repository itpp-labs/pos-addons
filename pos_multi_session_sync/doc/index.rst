============================
 Sync Server for POS orders
============================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Separate Sync Server
--------------------

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

Example of a nginx file::

        server {
            listen 80;
            server_name separated_sync_server;

            proxy_buffers 16 64k;
            proxy_buffer_size 128k;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            #proxy_redirect http:// https://;
            proxy_read_timeout 600s;
            client_max_body_size 100m;

            location /longpolling {
                proxy_pass http://127.0.0.1:8082;
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
            }

            location / {
                proxy_pass http://127.0.0.1:8079;
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
            }
        }
        server {
            listen 80;
            server_name main_server;

            proxy_buffers 16 64k;
            proxy_buffer_size 128k;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            #proxy_redirect http:// https://;
            proxy_read_timeout 600s;
            client_max_body_size 100m;

            location /longpolling {
                proxy_pass http://127.0.0.1:8072;
            }

            location / {
                proxy_pass http://127.0.0.1:8069;
            }
        }

Configuration
=============

Separate Sync Server
--------------------
In order to configure access to the sync server do the following on a server:

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Parameters >> System Parameters``
* Click ``[Create]``

  * Specify 'pos_longpolling.allow_public' in the field **Key**
  * Specify '1' in the field **Value**

* Click ``[Save]``


Main server
-----------

Configure sync server in the main server :

* Open ``[[ Point of Sale ]] >> Configuration >> Point of sale``
* Click on a POS belonging to Multi-session required for syncing
* Click ``[Edit]``
* Specify an external server url in the field **Sync Server**. Example of a filled-in field ``//localhost:8080``
* Click ``[Save]``
