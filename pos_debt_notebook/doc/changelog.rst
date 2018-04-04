`4.0.2`
-------
- **FIX:** TypeError: self.new_client is null when `Pay Full Debt`

`4.0.1`
=======
- **FIX:** Extra Debt payment lines when using "Pay Full Debt" method.
- **FIX:** Incorrect order validation.

`4.0.0`
-------
- **ADD:** Credits can be purchased via Credit Product. No need to use Debt Journal at that case
- **ADD:** Max Debt setting per each customer. Default is 0.
- **ADD:** Age analysis, debt statistics
- **ADD:** An ability to select a way to display debt values: debt or credit
- **ADD:** Colors of debt values

`3.0.1`
-------

- FIX: The "change" can be added to Debt Journal as negative amount of debt

`3.0.0`
-------

- Merge with the module "tg_pos_debt_notebook"

`2.0.0`
-------

- Add Multi-Company Mode

`1.0.2`
-------

- Add Dummy product settings to pay debt

`1.0.1`
-------

- Port to the new API of Odoo
- Add *debt* field in account.journal form view
- Add *debt* field in res.partner kanban view
- Add French translation
- Code is now PEP8 compliant
