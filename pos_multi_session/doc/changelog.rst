`4.2.4`
-------

**Fix:** Do not create a new order after removing the last order from another POS if you are on the Floor

`4.2.3`
-------

**Improvement:** Code refactoring to pay technical debt

`4.2.2`
-------

**Fix:** Don't make automatic scrolling of the current order on changing other orders

`4.2.1`
-------

**Fix:** Error related to longpoll updates of paid orders
**Fix:** Cannot read property then of undefined or request_sync_all is undefined

`4.2.0`
-------
**Fix:** 'order_line.node' is undefined
**New:** Added synchronization among the same POS
**Improvement:** Orderlines added to existing orders in offline mode won't be lost after reestablishing a connection
**Improvement:** Warning message "No connection to the server..." is automatically closing after connection is reestablished

`4.1.1`
-------
**Improvement:** Multi-Session methods renamings

`4.1.0`
-------
**New:** Field "Active" to enable/disable synchronization for POSes. The multi-session parameter is required now to provide compatibility with "POS Multi Session Menu" module and other modules that put common settings in "POS Multi Session"

`4.0.6`
-------
**Fix:** Incompatibility with pos_order_cancel_restaurant: it showed *Synchronization error* on removing order

`4.0.5`
-------
**Improvement:** Improved performance

`4.0.4`
-------
**Fix:** Remove some orders after revision error

`4.0.3`
-------
**Improvement:** All data are updated during POS loading
**Improvement:** Improved orderline updating speed after synchronization with server

`4.0.2`
-------
**Improvement:** Dramatically improved performance

`4.0.1`
-------
**Improvement:** Refactoring the code to fix a slow POS synchronization

`4.0.0`
-------
**Improvement:** Server side of synchronization is moved to the separate module ``pos_multi_session_sync``
**New:** Allow to make synchronization via local server
**New:** Fiscal position synchronization

`3.1.0`
-------

**New:** Added "Multi-session Settings" form.
**New:** Added unsynchronized POS in Demo.
**New:** Added unittests.

`3.0.4`
-------

**Fix:** Errors in case of an empty multi_session_id field.

`3.0.3`
-------

**Fix:** KeyError: 'sequence_number'.

`3.0.2`
-------

**Fix:** Remove unpaid orders, once all synced sessions are closed.

`3.0.1`
-------

**Fix:** Issue on sessions synchronization after order transfer.

`3.0.0`
-------

**Fix:** Added a queue for request sending that allows to fix the syncronization error on slow or lost  connection
**New:** Added connection status with server to POS interface
**New:** Create new orders even if the connection with server temporarily has been lost

`2.0.1`
-------

**Fix:** "Sync conflict" error on slow connection

`2.0.0`
-------

**New:** Protection against concurrent or obsolete order update requests
**New:** Stable order numbering: no duplicates, no omissions. Use word "New" for unregistered empty orders.
**New:** Restoring after connection problems

`1.0.4`
-------
**Fix:** Print only not printed order lines (*Order* button).

`1.0.3`
-------
**Improvement:** For pos restaurant compatibility. Sync notes. Sync guests.

`1.0.2`
-------
**Fix:** For pos restaurant compatibility. Sync printed positions.

`1.0.1`
-------

**Fix:** Orders some times was out of sync. Now its ok.
**Fix:** A bug related to updates in built-in bus module from Jan 20th 2016: https://github.com/odoo/odoo/commit/8af3841cb25cee33fd503ebe692abb8f98d4840a
**New:** Added demo data.
**New:** keep empty order. In previous version we deleted it when new Order from another POS is come. Now you can set it up in settings.
**New:** switch on income order if active order is empty. You can chose to switch on new income order or not.


`1.0.0`
-------

**Init version**
