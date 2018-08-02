odoo.define('pos_logout.popups', function (require) {
    "use strict";

    var PopupWidget = require('point_of_sale.popups');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');

    var _t = core._t;

    var barcode_cashier_action = function (code) {
        var self = this,
            users = this.pos.users;
        for (var i = 0, len = users.length; i < len; i++) {
            if(users[i].barcode === code.code){
                this.pos.set_cashier(users[i]);
                this.chrome.widget.username.renderElement();
                this.gui.close_popup();
                return true;
            }
        }
        this.barcode_error_action(code);
        return false;
    };

    var BlockPopupWidget = PopupWidget.extend({
        template: 'BlockPopupWidget',
        show: function (options) {
            var self = this;
            this._super(options);
            this.renderElement();
            $('.modal-dialog.block').click(function(){
                self.click_unlock();
            });
            this.pos.barcode_reader.set_action_callback({
                'cashier': _.bind(self.barcode_cashier_action, self)
            });
        },


        click_unlock: function() {
            var self = this;
            this.gui.close_popup();
            this.gui.select_user_custom({
                'special_group': this.pos.config.group_pos_user_id[0],
                'security': true,
                'current_user': false,
                'arguments': {
                    'deblocking': true,
                },
            }).fail(function(){
                self.gui.show_popup('block', self.options);
            });
        },
    });
    BlockPopupWidget.prototype.barcode_cashier_action = barcode_cashier_action;
    gui.define_popup({name:'block', widget: BlockPopupWidget});

    return BlockPopupWidget;
});
