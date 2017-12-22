odoo.define('pos_qr_login.popups', function (require) {
    "use strict";

    var PopupWidget = require('point_of_sale.popups');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    
    var _t = core._t;

    var BlockPopupWidget = PopupWidget.extend({
        template: 'BlockPopupWidget',
        show: function (options) {
            var self = this;
            this._super(options);
            this.renderElement();
            this.$('.fa-lock').click(function(){
                self.click_unlock();
            });
            this.pos.barcode_reader.set_action_callback({
                'cashier': _.bind(self.barcode_cashier_action, self)
            });
        },
        barcode_cashier_action: function (code) {
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
        },

        click_unlock: function() {
            this.gui.close_popup();
            this.gui.show_popup('selection_with_pass', {
                title: 'Select User',
                list: this.get_list(),
            });
            // if (this.options.confirm) {
            //     this.options.confirm.call(self);
            // }
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
    gui.define_popup({name:'block', widget: BlockPopupWidget});

    var PassSelectionPopupWidget = PopupWidget.extend({
        template: 'SelectionPopupWidget',
        show: function(options){
            var self = this;
            options = options || {};
            this._super(options);
            this.block = true;
            this.list = options.list || [];
            this.is_selected = options.is_selected || function (item) { return false; };
            this.renderElement();
        },

        click_item: function(event) {
            var self = this;
                var item = this.list[parseInt($(event.target).data('item-index'))];
                item = item ? item.item : item;
                this.gui.close_popup();
                this.show_pw_popup(item.pos_security_pin, item);
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
                        self.pos.set_cashier(user);
                        self.gui.chrome.widget.username.renderElement();
                        return;
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
    gui.define_popup({name:'selection_with_pass', widget: PassSelectionPopupWidget});

    return BlockPopupWidget;
});
