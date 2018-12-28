`3.2.6`
-------
**Improvement:** Compatibility with pos_order_receipt_custom module

`3.2.5`
-------
**Improvement:** Synchronize the process of deleting or adding tables

`3.2.4`
-------
**Fix:** 'order_line.node' is undefined

`3.2.3`
-------
**Improvement:** Multi-Session methods renamings

`3.2.2`
-------
**Improvement:** Improved performance

`3.2.1`
-------
**Improvement:** Refactoring the code to improve the speed of POS synchronization

`3.2.0`
-------
**Improvement:** Optimization the rendering of orderlines after orders printing

`2.2.0`
-------
**Improvement:** New option to disable changing Qty for orders sent to kitchen

`2.1.3`
-------
**Improvement:** The code optimization of load data after syncing POS with a server

`2.1.2`
-------
**Improvement:** Refactoring the code to fix a slow POS synchronization

`2.1.1`
-------
**Fix:** Floor rendering error in case if POS without any floors

`2.1.0`
-------
**Improvement:** POSes in Multi-session have one common floor set. Unsynchronized POSes may have its own floor set.
**Fix:** Deleting floors data whilst removing them from POS.

`2.0.0`
-------
**Fix:** POS floors synchronization.
**Improvement:** to_pos_shared was removed from dependencies. After updating this module is necessary to remove module to_pos_shared and update the module once again.

`1.1.8`
-------
**Improvement:** show Multi-session value in Dashboard.
**Improvement:** allow group by Multi-session in Dashboard.
**Fix:** Order button was not synced after adding notes.

`1.1.7`
-------
**Fix:** Issue with bill splitting: incorrect creation of a new order for other POSes after synchronization.
**Fix:** "ReferenceError: Can't find variable: Model" during new partner creation in POS.

`1.1.6`
-------
**Fix:** sync empty orders

`1.1.5`
-------
**Fix:** Issue related to error 'get_orderlines is undefined'

`1.1.4`
-------
**Fix:** Send to sync already printed order lines to not print it on remote POS.

`1.1.3`
-------
**Fix:** in some cases POS loading was stopped.

`1.1.2`
-------
**Improvement:** Sync printed positions.

`1.1.1`
-------
**Improvement:** Sync notes. Sync guests.

`1.1.0`
-------

**Improvement:** Removed virtual table. Added constraint of different floors in POS that has same multi session.

`1.0.1`
-------

**Improvement:** Every tables sync according to its floor

`1.0.0`
-------

**New:** Allows to attach all synced orders to some (virtual) table.
