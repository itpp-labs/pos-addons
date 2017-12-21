Sync POS orders across multiple sessions
========================================

The module provides instant orders synchronization between POSes related to a common *multi session*.

Server side of synchronization is handled by module ``pos_multi_session_sync``. The role of *Sync Server* may have same odoo server as well as separate odoo server (e.g. server in local network).

Instant data exchange are made via built-in longpolling feature extended by ``pos_longpolling`` module.

When POS becomes offline, i.e. don't have connection to *Sync Server*, it is only able to create new orders and not allowed to modify exising orders to avoid synchronization problems.

Some POSes may be configured to work without synchronization. In such case it will work just like without the module.

Modules compatibility
---------------------

For the compalibility of `pos_multi_session <https://www.odoo.com/apps/modules/10.0/pos_multi_session/>`__ module with other modules that add additional data to the Order or Orderline JS model, it is necessary to use the ``apply_ms_data`` function in these models.

.. code-block:: ruby

    apply_ms_data: function(data) {
        if (_super_order.apply_ms_data) {
            _super_order.apply_ms_data.apply(this, arguments);
        }
        this.first_new_variable = data.first_new_variable;
        this.second_new_variable = data.second_new_variable;
        // etc ...
    }

This function allows you to synchronize ``first_new_variable``, ``second_new_variable`` and other data of accross all POSes.

It is necessary to check the presence of the super method for the function, in order to be able to inherit the ``apply_ms_data`` function in other modules without specifying ``require`` of the `pos_multi_session <https://www.odoo.com/apps/modules/10.0/pos_multi_session/>`__ module (without adding in dependencies in the manifest).

At the time of loading, the super method may not exist. So, if the js file is loaded first, among all inherited, then there is no super method and it is not called, if the file is not the first, then the super method is already created by other modules, and we inherit this function.

The following is an example of using this function in the `pos_order_note <https://www.odoo.com/apps/modules/11.0/pos_order_note/>`__ module pos_order_note module to synchronize new data:

.. code-block:: ruby

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
	    apply_ms_data: function(data) {
            if (_super_order.apply_ms_data) {
                _super_order.apply_ms_data.apply(this, arguments);
            }
            this.note = data.note;
            this.old_note = data.old_note;
            this.custom_notes = data.custom_notes;
            this.old_custom_notes = data.old_custom_notes;
            this.pos.gui.screen_instances.products.order_widget.renderElement(true);
        },
    });

In the ``pos_order_note module``, this function allows you to synchronize all notes to an order across all POSes and updates OrderWidget to display this data.

Credits
=======

Contributors
------------
* `Ivan Yelizariev <https://it-projects.info/team/yelizariev>`__
* `Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>`__

Sponsors
--------
* `IT-Projects LLC <https://it-projects.info>`__

Maintainers
-----------
* `IT-Projects LLC <https://it-projects.info>`__

Further information
===================

Demo: http://runbot.it-projects.info/demo/pos-addons/10.0

HTML Description: https://apps.odoo.com/apps/modules/10.0/pos_multi_session/

Usage instructions: `<doc/index.rst>`_

Changelog: `<doc/changelog.rst>`_

Tests: `<external_tests/README.rst>`__

Tested on Odoo 10.0 33a04354eb2b3897035c7206411fa0130b312313
