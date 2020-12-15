==========================
 POS: Longpolling support
==========================

Longpolling
===========

Check following resources about activating longpolling:

* Official doc: https://www.odoo.com/documentation/12.0/setup/deploy.html#builtin-server
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

PgBouncer
---------
If you use *PgBouncer* or something similar, be sure that ``LISTEN/NOTIFY`` features are supported. For *PgBouncer* it means that you have to use *Session pooling*

Database connections limit
==========================

It's highly recommended to `check odoo and postgresql settings about connections limits <https://odoo-development.readthedocs.io/en/latest/admin/db_maxconn.html>`__. In short, it must satisfy following condition::

    (1 + workers + max_cron_threads) * db_maxconn < max_connections

Where ``max_connections`` is postgresql setting and the rest are from odoo.

Installation
============

The module version 2.3.0 requires Odoo to be updated at least to the 2f849cf80d1262f8e801b20321d99fdff667090c commit.

Usage
=====

Status Icons
------------

Longpolling Icon:

* *Red -* There is no connection to the server. Offline mode
* *Orange -* There is a connection to the server, but we haven't received a response from polling yet
* *Green -* Online
* *Rotating -* Connection is updating

To manually reestablish connection or to check its presence click on the longpolling icon.

*Wi-Fi* Icon:

Shows the correctness of the order sending to the server

* *Red -* There are some unsent paid orders.
* *Green -* All paid orders were sent.

*Wi-Fi* sign can be reestablished only manually, or after the one another order is paid.
If it is red make sure that the internet connection is on and click on the icon to send orders before turning off the device in order to prevent data loss.
If internet connection is present but orders are not sending, it could mean that the error has occurred.
