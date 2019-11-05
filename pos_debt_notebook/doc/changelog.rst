`5.3.2`
-------
- **Fix:** Double move lines for POS orders

`5.3.1`
-------
- **Fix:** Credit Product Field was accessible only with **Show Full Accounting Features** option enabled so it has been moved to Sales tab

`5.3.0`
-------
- **Improvement:** New Balance is amount for selected journal,  not for total Credits.

`5.2.1`
-------

- **Improvement:** `Configuration -> Settings` were moved to `Point of Sale` menu
- **Fix:** Error in order with combined payment methods

`5.2.0`
-------
- **ADD:** Button on the ``Write-off Credits`` form. Adds all partners with debt according to the selected journal
- **ADD:** Availability to write-off credits via ``Manual Credit Updates``

`5.1.4`
-------
- **FIX:** Payment mistakes on in case SERIALIZATION_FAILURE in order processing

`5.1.4`
-------
- **FIX:** Unavailability to withdraw credits

`5.1.3`
-------
- **FIX:** Error related to pos loading with the lack of customers

`5.1.2`
-------
- **FIX:** Availability to buy credit top-up products with discount credits
- **FIX:** Error related to automatic receipt printing
- **ADD:** Mandatory Payment Method selection for return orders
- **FIX:** Compatibility with pos_category_multi
- **FIX:** Unavailability to cash out credits from journals with defined category
- **FIX:** Errors on loading debts on POS opening were ignored

`5.1.1`
-------
- **FIX:** Compatibility with pos_orders_history_return module

`5.1.0`
-------
- **NEW:** Wizard allow to create invoices for sets of partners: `Balance update`, `New Balance`
- **FIX:** Error related to paying with not discount credit journals in POS
- **FIX:** Invoices paid with credit journals now counts in partner debts

`5.0.5`
-------

- **FIX:** Error on module deleting
- **FIX:** Error related to invoices created in the "Generate POS Credit Invoices" wizard. Invoices were created with wrong type.

`5.0.4`
-------

- **FIX:** compatibility with pos_category_multi
- **FIX:** Error after clicking "Show Debt History" for a customer

`5.0.3`
-------

- **FIX:** Compatibility with other pos modules
- **FIX:** Error message displaying on discount credit paymentlines with zero price 
- **FIX:** Lost overrides of the `order` and `session` forms

`5.0.2`
-------

- **FIX:** Error related to debt loading after creating a new partner in POS

`5.0.1`
-------

- **Fix:** installation error in some cases

`5.0.0`
-------

- **ADD:** Cash out feature
- **ADD:** Multiple debit credit accounts
- **ADD:** Smart button with debts/credits on a customer view
- **ADD:** Credits via discount
- **FIX:** Debt history for Chinese localization
- **FIX:** Error when user doesn't have timezone
- **FIX:** user_id was always replaced to Administrator in pos.order
- **IMP:** Updating debts/credits data for partners in opened orders after restoring the internet connection
- **ADD:** Option 'Autopay' for debt journals

`4.4.3`
-------

- **FIX:** Compatibility with Chinese localization

`4.4.2`
-------

- **ADD:** Compatibility with Pos Mobile

`4.4.1`
-------

- **FIX:** Extra Debt payment lines when using "Pay Full Debt" method.
- **FIX:** Incorrect order validation.

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
