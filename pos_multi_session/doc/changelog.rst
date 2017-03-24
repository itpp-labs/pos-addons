.. _changelog:

Updates
=======

`1.0.4`
-------
- FIX: Print only not printed order lines (*Order* button).

`1.0.3`
-------
- IMP: For pos restaurant compatibility. Sync notes. Sync guests.

`1.0.2`
-------
- FIX: For pos restaurant compatibility. Sync printed positions.

`3.0.2`
-------

- FIX: Remove unpaid orders, once all synced sessions are closed.

`3.0.1`
-------

- FIX: Issue on sessions synchronization after order transfer.

`3.0.0`
-------

- FIX: Added a queue for request sending that allows to fix the syncronization error on slow or lost  connection
- NEW: Added connection status with server to POS interface
- NEW: Create new orders even if the connection with server temporarily has been lost

`2.0.1`
-------

- FIX: "Sync conflict" error on slow connection

`2.0.0`
-------

- NEW: Protection against concurrent or obsolete order update requests
- NEW: Stable order numbering: no duplicates, no omissions. Use word "New" for unregistered empty orders.
- NEW: Restoring after connection problems


`1.0.1`
-------

- Fix.Orders some times was out of sync. Now its ok.
- Fix a bug related to updates in built-in bus module from Jan 20th 2016: https://github.com/odoo/odoo/commit/8af3841cb25cee33fd503ebe692abb8f98d4840a
- Added demo data.
- New: keep empty order. In previous version we deleted it when new Order from another POS is come. Now you can set it up in settings.
- New: switch on income order if active order is empty. You can chose to switch on new income order or not.


`1.0.0`
-------

- init version
