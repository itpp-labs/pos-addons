.. image:: https://img.shields.io/badge/license-LGPL--3-blue.png
   :target: https://www.gnu.org/licenses/lgpl
   :alt: License: LGPL-3

Sync POS orders across multiple sessions (restaurant extension)
===============================================================

Syncs additional restaurant data:

* Table and floor
* Guests number
* Printer status (green "Order" button)
* Notes

Each multi-session and each unsynchronized POS may have its own floor set. POSes in multi-session have same floors.

FIXME: there is issue with floor real-time synchronization, to synchronize tables after modifying them it is mandatory to refresh all POSes pages, also deleting a table with open order on it leads to constant error messages. See https://github.com/it-projects-llc/pos-addons/issues/375.

Local run
---------

If you use dbfilter, don't forget to specify correct proxy on printers

Further information
-------------------

Tested on Odoo 11.0 c6f1f054662574d16d9673218b5172f02a1636a3

Need our service?
-----------------

Contact us by `email <mailto:it@it-projects.info>`__ or fill out `request form <https://www.it-projects.info/page/website.contactus>`__:

* it@it-projects.info
* https://www.it-projects.info/page/website.contactus
