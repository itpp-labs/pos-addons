=================
 POS Longpolling
=================

Longpolling
===========

Check following resources about activating longpolling:

* Official doc: https://www.odoo.com/documentation/8.0/setup/deploy.html#builtin-server
* Non-official doc: https://odoo-development.readthedocs.io/en/latest/admin/longpolling.html

In short, you need to start server with non-zero ``workers`` parameter:::

    openerp-server --workers=2 ...

and configure nginx: ::

    location /longpolling {
        proxy_pass http://127.0.0.1:8072;
    }
    location / {
        proxy_pass http://127.0.0.1:8069;
    }

Database connections limit
==========================

It's highly recommended to `check odoo and postgresql setttings about connections limits <https://odoo-development.readthedocs.io/en/latest/admin/db_maxconn.html>`__. In short, it must satisfy following condition::

    (1 + workers + max_cron_threads) * db_maxconn < max_connections

Where ``max_connections`` is postgresql setting and the rest are from odoo.
