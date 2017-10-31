==========================================
 Sync POS orders across multiple sessions
==========================================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Longpolling
-----------

Check following resources about activating longpolling:

* Official doc: https://www.odoo.com/documentation/8.0/setup/deploy.html#builtin-server
* Non-official doc: https://odoo-development.readthedocs.io/en/latest/admin/longpolling.html

In short, you need to start server with non-zero ``workers`` parameter:::

    ./odoo-bin --workers=2 ...

and configure nginx: ::

    location /longpolling {
        proxy_pass http://127.0.0.1:8072;
    }
    location / {
        proxy_pass http://127.0.0.1:8069;
    }

Configuration
=============

To create a multi-session follow next steps:

* Open menu ``Point of Sale``
* Click ``Configuration >> Multi-session Settings``
* Click ``[Create]``
* Paste a name for multi-session in the field **Name**
* Chose POSes you want to add in the multi-session. Theirs previous sessions are have to be closed before adding.
* Click ``[Save]``

Domain switching
================

There is a rare case, when you need to clear browser data after installation: if you use this module on a website domain, that was previously used by another database with this module installed. E.g. main_company.example.com was used by ``database1`` and then the domain starts to handle another ``database2``. In that case browser data has to be cleanned on all devices before first use.
