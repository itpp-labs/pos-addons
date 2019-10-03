`1.0.6`
-------
- **Fix:** Updated 'update_revision_ID' message

`1.0.5`
-------
- **Fix:** Cross multi-sesion messaging in case the same pos was assigned to a different multi-session
- **Fix:** Possible loss of orders for multiple multi-sessions working simultaneously when another new one starts

`1.0.4`
-------
- **Fix:** Random sync problems

`1.0.3`
-------
- **Fix:** Complete synchronization raised conflict error in case of slow connection and receiving new updates on waiting finishing synchronization. Fix it by using the same updates queue (longpolling) for complete synchronization as for small updates.

`1.0.2`
-------
- **IMP:** Refactoring the code to fix screen hanging when synchronization

`1.0.1`
-------
- **IMP:** Refactoring the code to fix a slow POS synchronization

`1.0.0`
-------

- Init version
