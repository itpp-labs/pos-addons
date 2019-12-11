=========================
 QR Code Scanning in POS
=========================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Configuration
=============

Browser may not give access to camera if using insecure ``http`` connection.

Reference: https://www.w3.org/TR/secure-contexts/#threat-risks

Possible NGINX configurations to support ``https``::

    server {
        listen         443 ssl;
        server_name    posadd.odoo11.local;
        ssl_certificate /etc/nginx/ssl/nginx.crt;
        ssl_certificate_key /etc/nginx/ssl/nginx.key;
        ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;

        if ( $scheme = "http" )
        {
            rewrite ^/(.*)$ https://$host/$1 permanent;
        }

        proxy_buffers 16 64k;
        proxy_buffer_size 128k;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        client_max_body_size 100m;

        location /longpolling {
            proxy_pass http://127.0.0.1:8072;
        }

        location / {
            proxy_pass http://127.0.0.1:8069;
        }
    }
