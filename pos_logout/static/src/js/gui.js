/*  Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
    Copyright 2017 Artyom Losev <https://github.com/ArtyomLosev>
    Copyright 2018 Ilmir Karamov <https://it-projects.info/team/ilmir-k>
    Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
    Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_logout.gui', function (require) {
    "use strict";
    var gui = require('point_of_sale.gui');
    var core = require('web.core');

    var _t = core._t;

    gui.Gui.include({
        show_password_popup: function(password, lock){
            var self = this;
            this.show_popup('password',{
                'title': _t('Password ?'),
                confirm: function(pw) {
                    if (pw === password) {
                        lock.resolve();
                    } else {
                        self.show_popup('error', {
                            'title': _t('Incorrect Password'),
                            confirm: _.bind(self.show_password_popup, self, password, lock),
                            cancel: _.bind(self.show_password_popup, self, password, lock),
                        });
                    }
                },
                cancel: function(pw) {
                    self.show_popup('block', {});
                    lock.reject();
                },
            });
            return lock;
        },

        ask_password: function(password, args) {
            var self = this;
            var lock = new $.Deferred();

            if (args && args.deblocking && password) {
                this.show_password_popup(password, lock);
                return lock;
            }

            return this._super(password);
        },
    });

    return gui;
});
