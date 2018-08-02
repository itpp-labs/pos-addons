odoo.define('pos_logout.gui', function (require) {
    "use strict";

    var gui = require('point_of_sale.gui');
    var core = require('web.core');

    var _t = core._t;

    gui.Gui.include({
        ask_password: function(password, args) {
            var self = this;
            if (args && args.deblocking) {
                var ret = new $.Deferred();
                if (password) {
                    function show_password_popup(){
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
                    }
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
