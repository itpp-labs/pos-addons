=========================
 Multi categories in POS
=========================

Installation
============

When the module has been installed, pos_categ_id field (model: Product) with many2one type will be deactivated. It will create pos_category_ids field with many2many type instead. Values of the field are not transferred (it is possible to implement in the future).

Usage
=====
After installation check that categories are empty.

* Add some product into two different POS categories
* Open the first category
* Check the product is available in
* Then open the second category and check the same.

Uninstallation
==============

After the module uninstallation pos_category_ids field will be deleted and pos_categ_id field will be activated.
