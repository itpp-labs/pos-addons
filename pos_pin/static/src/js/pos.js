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
            var user = options.current_cashier || this.pos.get_cashier();
        
            if (user.role === 'manager') {
                return new $.Deferred().resolve(user);
            } else if (this.pos.config.module_pos_hr) {
                return this.select_user_custom(_.extend(options, {
                    'security': true,
                    'current_user': user,
                }));
            }
            return new $.Deferred().reject(user);
        },
        select_user_custom: function(options){
            options = options || {};
            var self = this;
            var def = new $.Deferred();

            var list = [];
            _.each(this.pos.employees, function(employee) {
                if (!options.only_managers || employee.role === 'manager') {
                    list.push({
                    'label': employee.name,
                    'item':  employee,
                    });
                }
            });

            this.show_popup('selection', {
                title: options.title || _t('Select User'),
                list: list,
                confirm: def.resolve,
                cancel: def.reject,
            });

            return def.then(function(cashier){
                if (options.security && cashier !== options.current_user && cashier.pin) {
                    return self.ask_password(cashier.pin, options.arguments).then(function(){
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
                    if (window.Sha1.hash(pw) === password) {
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
