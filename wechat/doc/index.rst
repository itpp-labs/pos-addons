==================
 WeChat API Server
==================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Server Configuration
====================

Nginx
-----

* In ``/etc/nginx/sites-available`` create one file ``nginx.conf`` with the next configuration::

     server {
            listen 80 default_server;
            server_name .local;

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

* Create a shortcut in ``/etc/nginx/sites-enabled`` on a previous file

!!! probably it's necessary to detalise commands and installed libraries, but it's lost

Wechat libraries
----------------

* Execute next commands on your server to install obliged libraries
apt-get install gcc
apt-get install python3-dev
pip install cryptography>=0.8.2
pip install pycrypto>=2.6.1
pip install wechatpy
pip install wechatpy[cryptography]
pip install wechatpy[pycrypto]
pip install -U wechatpy

Wechat URL verification
-----------------------

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Open menu ``[[ Settings ]] >> Parameters >> System Parameters``
* Click ``[Create]``

  * Specify 'wechat.appId' in the field **Key**
  * Specify your obtained from wechat APPID in the field **Value**

* Click ``[Save]``

* Also create keys 'wechat.appSecret' and 'wechat.token'
