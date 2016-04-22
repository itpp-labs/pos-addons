========================================
 Multiple categories per product in POS
========================================

Installation
============

When the module installation pos_categ_id field (model: Product) with many2one type will be deactivated. Instead it will create pos_category_ids with many2many type. Values are not transferred (in the future it is possible to implement).

Usage
=====
After installation check that categories is empty. For it open two difference category.

Add some product into two difference categories. Then open first category and check that the product are available in it. After that open second category and check the same.

Uninstallation
==============

On the module uninstallation pos_category_ids field will be deleted. And pos_categ_id field will be activated.
