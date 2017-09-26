odoo.define('pos_debt_notebook.draft', function (require) {
    "use strict";

    var core = require('web.core');
    var FormView = require('web.FormView');

    var QWeb = core.qweb;
    var _t = core._t;

    FormView.include({
        on_form_changed: function() {
            this._super.apply(this, arguments);
            if (this.model === 'pos.credit.update') {
                if (this.get_fields_values().state === 'draft') {
                    this.$buttons.find('.o_form_button_save').addClass('o_disabled').prop('disabled', true);
                } else {
                    this.$buttons.find('.o_form_button_save').removeClass('o_disabled').prop('disabled', false);
                }
            }
        },

        can_be_discarded: function() {
            if (this.model === 'pos.credit.update' && this.get_fields_values().state === 'draft') {
                var message = _t("The draft record has been modified, your changes will be discarded. Perhaps you would like to switch to Canceled state. Are you sure you want to leave this page ?");
                return this._super(message);
            }

            return this._super.apply(this, arguments);
        }
    });
});
