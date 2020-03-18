// Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
// Copyright 2019 Kildebekov Anvar <https://it-projects.info/team/kildebekov>
// License MIT (https://opensource.org/licenses/MIT).
odoo.define("pos_journal_pin", function(require) {
    "use strict";

    var models = require("point_of_sale.models");
    var screens = require("point_of_sale.screens");

    models.load_fields("account.journal", ["ask_manager"]);

    screens.PaymentScreenWidget.include({
        click_numpad: function(button) {
            var paymentlines = this.pos.get_order().get_paymentlines();
            if (paymentlines.length || !this.pos.cashregisters[0].journal.ask_manager) {
                return this._super(button);
            }
            this.click_paymentmethods(this.pos.cashregisters[0].journal_id[0]);
        },
        click_paymentmethods: function(id) {
            var cashregister = null;
            for (var i = 0; i < this.pos.cashregisters.length; i++) {
                if (this.pos.cashregisters[i].journal_id[0] === id) {
                    cashregister = this.pos.cashregisters[i];
                    break;
                }
            }
            if (!cashregister.journal.ask_manager) {
                return this._super(id);
            }
            var manager_group_id = this.pos.config.group_pos_manager_id[0];
            var is_manager = _.include(this.pos.cashier.groups_id, manager_group_id);
            if (is_manager) {
                return this._super(id);
            }
            var click_paymentmethods_super = _.bind(this._super, this);
            return this.pos.gui
                .sudo_custom({
                    special_group: manager_group_id,
                    do_not_change_cashier: true,
                    arguments: {
                        ask_untill_correct: true,
                    },
                })
                .done(function(user) {
                    return click_paymentmethods_super(id);
                });
        },
    });
});
