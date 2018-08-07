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
        ask_password: function(password, args) {
            var self = this;
            var ret = new $.Deferred();
            var show_password_popup = function(){
                self.show_popup('password',{
                    'title': _t('Password ?'),
                    confirm: function(pw) {
                        if (pw === password) {
                            ret.resolve();
                        } else {
                            show_password_popup();
                        }
                    },
                    cancel: function(pw) {
                        ret.reject();
                    },
                });
            };
            if (args && args.deblocking) {
                if (password) {
                    show_password_popup();
                } else {
                    ret.reject();
                }
                return ret;
            }

            return this._super(password);
        },
    });

    return gui;
});
