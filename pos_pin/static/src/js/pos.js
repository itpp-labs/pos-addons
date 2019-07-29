/*  Copyright 2016 Krotov Stanislav <https://github.com/ufaks>
    Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html).*/
odoo.define('pos_pin.pos', function (require) {
    "use strict";

    var gui = require('point_of_sale.gui');
    var core = require('web.core');

    var _t = core._t;

    gui.Gui.include({
        sudo_custom: function(options) {
            options = options || {};
            var user = options.user || this.pos.get_cashier();
        
            if ($.inArray(options.special_group, user.groups_id) >= 0) {
                return new $.Deferred().resolve(user);
            } else {
                return this.select_user_custom(_.extend(options, {
                    'security': true,
                    'current_user': this.pos.get_cashier(),
                }));
            }
        },
        select_user_custom: function(options){
            options = options || {};
            var self = this;
            var def = new $.Deferred();

            var list = [];
            for (var i = 0; i < this.pos.users.length; i++) {
                var user = this.pos.users[i];
                if ($.inArray(options.special_group, user.groups_id) >= 0) {
                    list.push({
                        'label': user.name,
                        'item':  user
                    });
                }
            }

            this.show_popup('selection',{
                'title': options.title || _t('Select User'),
                'list': list,
                'confirm': function(cashier){
                    def.resolve(cashier);
                },
                'cancel':  function(){
                    def.reject();
                }
            });

            return def.then(function(cashier){
                if (options.security && cashier !== options.current_user && cashier.pos_security_pin) {
                    return self.ask_password(cashier.pos_security_pin, options.arguments).then(function(){
                        return cashier;
                    });
                }
                return cashier;
            }).done(function(res){
                if (!res) {
                    return;
                }
                return self.check_then_set_and_render_cashier(options, res);
            });
        },

        check_then_set_and_render_cashier: function(options, user) {
            if (options.do_not_change_cashier){
                return user;
            }
            if (this.pos.get_cashier().id !== user.id) {
                this.pos.set_cashier(user);
                this.pos.chrome.widget.username.renderElement();
            }
            return user;
        },

        show_password_popup: function(password, lock, cancel_function){
            var self = this;
            this.show_popup('password',{
                'title': _t('Password ?'),
                confirm: function(pw) {
                    if (pw === password) {
                        lock.resolve();
                    } else {
                        self.show_popup('error', {
                            'title': _t('Incorrect Password'),
                            confirm: _.bind(self.show_password_popup, self, password, lock, cancel_function),
                            cancel: _.bind(self.show_password_popup, self, password, lock, cancel_function),
                        });
                    }
                },
                cancel: function() {
                    if (cancel_function) {
                        cancel_function.call(self);
                    }
                    lock.reject();
                },
            });
            return lock;
        },

        ask_password: function(password, options) {
            var self = this;
            var lock = new $.Deferred();

            if (options && options.ask_untill_correct && password) {
                this.show_password_popup(password, lock, options.cancel_function);
                return lock;
            }

            return this._super(password);
        },
    });

    return gui;

});
