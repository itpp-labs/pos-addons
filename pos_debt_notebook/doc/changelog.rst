`5.0.0`
-------

**ADD:** Cash out feature
**ADD:** Multiple debit credit accounts
**ADD:** Smart button with debts/credits on a customer view
**ADD:** Credits via discount
**FIX:** Debt history for Chinese localization

`4.4.3`
-------

**FIX:** Compatibility with Chinese localization

`4.4.2`
-------

**ADD:** Compatibility with Pos Mobile

`4.4.1`
-------

**FIX:** Extra Debt payment lines when using "Pay Full Debt" method.
**FIX:** Incorrect order validation.

`4.4.0`
-------

- **ADD:** new field *Company Credit Balance* -- sum of credits of all company's employees.
- **FIX:** move Debt fields at partner form. New place is Point of Sale section at Sales & Purchases tab. Otherwise the fields are hidden if partner has parent_id value
- **ADD:** wizard to add Credits to company's employees. It creates invoices per each partner.

`4.3.0`
-------

- **ADD:** Manual Credit Updates

`4.2.0`
-------

- **ADD:** The "Load More" button in debt history
- **ADD:** A product list to each debt history line

`4.1.0`
-------

- **ADD:** Invoice support
- **FIX:** Fetch new partners before loading their debt history (e.g. when another POS create partner)
- **ADD:** print prev and new debt value in receipt as well as customer name

`4.0.0`
-------

- **ADD:** An ability to show customer debt transactions 
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
