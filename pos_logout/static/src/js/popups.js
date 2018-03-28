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
            this.gui.close_popup();
            this.gui.show_popup('selection_with_pass', {
                title: 'Select User',
                list: this.get_list(),
            });
        },

        get_list: function () {
            var list = [];
            for (var i = 0; i < this.pos.users.length; i++) {
                var user = this.pos.users[i];
                    list.push({
                        'label': user.name,
                        'item':  user,
                    });
                }
            return list;
        }
    });
    BlockPopupWidget.prototype.barcode_cashier_action = barcode_cashier_action;
    gui.define_popup({name:'block', widget: BlockPopupWidget});

    var PassSelectionPopupWidget = PopupWidget.extend({
        template: 'SelectionPopupWidget',
        show: function(options){
            var self = this;
            options = options || {};
            this._super(options);
            this.block = true;
            this.list = options.list || [];
            this.is_selected = options.is_selected || function (item) {
		return false;
	    };
            this.renderElement();
            this.pos.barcode_reader.set_action_callback({
                'cashier': _.bind(self.barcode_cashier_action, self)
            });
        },

        click_item: function(event) {
            var self = this,
                item = this.list[parseInt($(event.target).data('item-index'))];
            item = item ? item.item : item;
            this.gui.close_popup();
            if (item.pos_security_pin) {
                this.show_pw_popup(item.pos_security_pin, item);
            } else {
                this.set_cashier(item);
            }
        },

        click_cancel: function () {
            this.gui.show_popup('block', {
                confirm: function() {
                    var blocking = true;
                    this.click_username(blocking);
                },
            });
        },

        set_cashier: function (user) {
            this.pos.set_cashier(user);
            this.gui.chrome.widget.username.renderElement();
            return;
        },

        show_pw_popup: function (password, user) {
            var self = this;
            this.gui.show_popup('password',{
                'title': _t('Password ?'),
                confirm: function(pw) {
                    if (pw !== password) {
                        // self.gui.show_popup('error',_t('Incorrect Password'));
                        self.show_pw_popup(password);
                    } else {
                        self.set_cashier(user);
                    }
                },
                cancel: function() {
                    self.gui.show_popup('block', {
                        confirm: function() {
                            var blocking = true;
                            self.click_username(blocking);
                        },
                    });
                },
            });
        }
    });
    PassSelectionPopupWidget.prototype.barcode_cashier_action = barcode_cashier_action;
    gui.define_popup({name:'selection_with_pass', widget: PassSelectionPopupWidget});

    return BlockPopupWidget;
});
