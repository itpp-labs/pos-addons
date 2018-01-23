
odoo.define('base_attendance.partner_kanban_view_handler', function(require) {
"use strict";

var KanbanRecord = require('web_kanban.Record');

KanbanRecord.include({
    on_card_clicked: function() {
        if (this.model === 'res.partner' && this.$el.parents('.o_res_partner_attendance_kanban').length) {
                                            // needed to diffentiate : check in/out kanban view of employees <-> standard employee kanban view
            var action = {
                type: 'ir.actions.client',
                name: 'Confirm',
                tag: 'hr_attendance_kiosk_confirm',
                partner_id: this.record.id.raw_value,
                partner_name: this.record.name.raw_value,
                partner_state: this.record.attendance_state.raw_value,
            };
            this.do_action(action);
        } else {
            this._super.apply(this, arguments);
        }
    }
});

});
