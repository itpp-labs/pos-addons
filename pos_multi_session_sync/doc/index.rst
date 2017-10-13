===============
 {Module name}
===============

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Nginx configurations
--------------------
For each docker runs on a different ports add the server block in the Nginx configuration file for example::

    server {
        listen 80;
        server_name $YOUR_SERVER_NAME;
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
            proxy_pass http://127.0.0.1:$LONGPOLLING_PORT;
        }
        location / {
            proxy_pass http://127.0.0.1:$XMLRPC_PORT;
        }
    }

If you've got 'Access-Control-Allow-Origin' error, try to write next code below each line contains proxy_pass::

        add_header 'Access-Control-Allow-Origin' * always;

