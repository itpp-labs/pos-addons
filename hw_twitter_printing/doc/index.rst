==========================
 Print tweets with PosBox
==========================

Installation
============

* Go to Twitter apps: https://apps.twitter.com/
* Click ``[Create New App]``
* Specify the Application Details
* Click ``[Create your Twitter application]``
* Go to ``Keys and Access Tokens`` tab
* Click ``modify app permissions`` and specify ``Read only``
* Click ``[Update Settings]``
* Go to ``Keys and Access Tokens`` tab
* Save  ``Consumer Key (API Key)`` and ``Consumer Secret (API Secret)`` in the PosBox config using the parameters twitter_app_key, twitter_app_secret
* Click ``[Create my access token]``
* Save ``Access Token`` and ``Access Token Secret`` in the PosBox config using the parameters twitter_oauth_token, twitter_oauth_token_secret
* Specify a ``Printer IP`` in the PosBox config using the parameter twitter_printer_ip
* Specify ``Keywords`` in the PosBox config using the parameter twitter_search (e.g.: twitter_search=#OdooExperience,#OdooExperience2017)

In PosBox
---------

* add ``hw_twitter_printing`` module to *server wide modules*. Detailed instruction is here: https://odoo-development.readthedocs.io/en/latest/admin/posbox/administrate-posbox.html#how-to-update-odoo-command-line-options

Gevent
------

If you face the problem like ``wrap_socket does not accept server_hostname``, try to upgrade ``gevent`` library
