/*  Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
    Copyright 2017 Artyom Losev <https://github.com/ArtyomLosev>
    Copyright 2018 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
    Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
    Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
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
        // is taken from the this.gui.current_screen.barcode_error_action
        var show_code = '';
        if (code.code.length > 32) {
            show_code = code.code.substring(0,29)+'...';
        } else {
            show_code = code.code;
        }
        this.gui.show_popup('custom-error-barcode',{
            barcode: show_code,
            confirm: _.bind(self.gui.show_popup, self.gui, 'block'),
            cancel: _.bind(self.gui.show_popup, self.gui, 'block'),
        });
        return false;
    };

    var CustomErrorBarcodePopupWidget = PopupWidget.extend({
        template:'ErrorBarcodePopupWidget',
        show: function(options){
            this._super(options || {});
            this.gui.play_sound('error');
        },
    });
    gui.define_popup({name:'custom-error-barcode', widget: CustomErrorBarcodePopupWidget});

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
            this.gui.current_popup.$(".exit").click(function(){
                self.gui.show_popup('block');
            });
        },

        click_confirm: function(){
            this.gui.close_popup();
            if (this.options.confirm) {
                this.options.confirm.call(this);
            } else {
                this.click_username(true);
            }
        },
    });
    BlockPopupWidget.prototype.barcode_cashier_action = barcode_cashier_action;
    gui.define_popup({name:'block', widget: BlockPopupWidget});

    return BlockPopupWidget;
});
