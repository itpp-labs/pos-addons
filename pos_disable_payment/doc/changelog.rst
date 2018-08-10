.. _changelog:

Updates
=======

`3.6.1`
-------
- IMP: Compatibility with pos_restaurant_base module

`2.6.1`
-------
- FIX: Option "Allow remove order line" didn't work correctly after the previous updates

`2.6.0`
-------
- NEW: New option "Allow change Qty for kitchen orders"

`2.5.0`
-------
- NEW: New option "Allow manual customer selecting" on user access rights

`2.4.1`
-------
- FIX: Compatibility with pos_discount
- IMP: When unchecked "Allow remove order line", the delete button is disabled if qty of the line < = 0

`2.4.0`
-------
- NEW: Set disabled button as non-clickable instead of hiding

`2.3.0`
-------
- NEW: New option "Allow refunds" on user access rights

`2.2.4`
-------
- FIX: module didn't work with older odoo version in some context

`2.2.3`
-------

- IMP: Compatibility with the latest odoo version, tested on Odoo 10 e14ab697727d87773dbefba11453b9edca79fc68

`2.2.2`
-------

- NEW: New option "Allow to create order line" for POS added to user access rights

`2.1.2`
-------

- FIX: "allow payments" checkbox was ignored after clicking "Set Customer" button

`2.1.1`
-------

- User POS settings now got two parameters (allow_decrease_amount and allow_delete_order_line) instead of only one
(allow_delete_order_line). If first parameter is FALSE than you cant set second one..

`2.0.0`
-------

- Restrictions sets in User.

`1.0.0`
-------

- Restriction sets in POS.
