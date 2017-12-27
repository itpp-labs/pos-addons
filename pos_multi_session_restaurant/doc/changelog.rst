.. _changelog:

Updates
=======

`2.1.1`
-------
- FIX: Floor rendering error in case if POS without any floors

`2.1.0`
-------
- IMP: POSes in Multi-session have one common floor set. Unsynchronized POSes may have its own floor set.
- FIX: Deleting floors data whilst removing them from POS.

`2.0.0`
-------
- FIX: POS floors synchronization.
- REM: to_pos_shared was removed from dependencies. After updating this module is necessary to remove module to_pos_shared and update the module once again.

`1.1.8`
-------
- ADD: show Multi-session value in Dashboard.
- ADD: allow group by Multi-session in Dashboard.
- FIX: Order button was not synced after adding notes.

`1.1.7`
-------
- FIX: Issue with bill splitting: incorrect creation of a new order for other POSes after synchronization.
- FIX: "ReferenceError: Can't find variable: Model" during new partner creation in POS.

`1.1.6`
-------
- FIX: sync empty orders

`1.1.5`
-------
- FIX: Issue related to error 'get_orderlines is undefined'

`1.1.4`
-------
- FIX: Send to sync already printed order lines to not print it on remote POS.

`1.1.3`
-------
- FIX: in some cases POS loading was stopped.

`1.1.2`
-------
- IMP: Sync printed positions.

`1.1.1`
-------
- IMP: Sync notes. Sync guests.

`1.1.0`
-------

- Removed virtual table. Added constraint of different floors in POS that has same multi session.

`1.0.1`
-------

- Every tables sync according to its floor

`1.0.0`
-------

- Allows to attach all synced orders to some (virtual) table.
