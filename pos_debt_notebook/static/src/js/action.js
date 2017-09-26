odoo.define('pos_debt_notebook.action', function (require) {
    "use strict";

    var core = require('web.core');
    var ListView = require('web.ListView');

    var QWeb = core.qweb;
    var _t = core._t;

    ListView.include({
        do_confirm_selected: function () {
            var records = this.groups.get_selection().records;
            this.do_confirm(records);
        },
        do_confirm: function (records) {
            var record_ids = [];
            var dataset = this.dataset;
            _.each(records, function(record) {
                // ensure_one
                dataset.call('write', [record.id, {state: 'confirm'}]);
            });
        },
        render_sidebar: function() {
            this._super.apply(this, arguments);
            if (this.model === 'pos.credit.update') {
                this.sidebar.add_items('other', _.compact([
                    {label: _t("Confirm"), callback: this.do_confirm_selected}
                ]));
            }
        }
    });
});
