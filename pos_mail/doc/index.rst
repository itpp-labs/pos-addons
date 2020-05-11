======================
 POS Receipts by mail
======================

Installation
============

* `Install <https://odoo-development.readthedocs.io/en/latest/odoo/usage/install-module.html>`__ this module in a usual way

Usage
=====

* `Activate Developer Mode <https://odoo-development.readthedocs.io/en/latest/odoo/usage/debug-mode.html>`__
* Fill the fields
* For `properly-handled` signature: in html-editor enter ``'Code View'``-mode by clicking ``"</>"``-icon

Template example:

    ---

    <p>Dear, ${partner.name}</p>

    <p>Thanks for purchasing in our shop</p>

    <p>Your order is: ${order.pos_reference}</p>

    <p>Best wishes.</p>


Will be converted to

    ---

    <p>Dear, Bob</p>

    <p>Thanks for purchasing in our shop</p>

    <p>Your order is: ${order.pos_reference}</p>

    <p>Best wishes.</p>
