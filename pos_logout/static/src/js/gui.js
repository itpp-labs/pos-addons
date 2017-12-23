odoo.define('pos_logout.gui', function (require) {
    "use strict";

    var gui = require('point_of_sale.gui');
    var core = require('web.core');

    var _t = core._t;

    gui.Gui.include({
        ask_password: function(password) {
            var self = this;
            var ret = new $.Deferred();
            if (password) {
                this.show_popup('password',{
                    'title': _t('Password ?'),
                    confirm: function(pw) {
                        if (pw !== password) {
                            self.show_popup('error',_t('Incorrect Password'));
                            ret.reject();
                        } else {
                            ret.resolve();
                        }
                    },
                    cancel: function() {
                        console.log("test cancel");
                    },
                });
            } else {
                ret.resolve();
            }
            return ret;
        },
    });

    return gui
});
