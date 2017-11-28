odoo.define('pos_qr_login.chrome', function (require) {
    "use strict";

    var chrome = require('point_of_sale.chrome');

    chrome.UsernameWidget.include({
        click_username: function(block) {
            this._super();
            var self = this;
            this.gui.current_popup.cashiers = true;
            if (block) {
                this.gui.current_popup.block = true;
            }
            this.gui.current_popup.renderElement();
            this.gui.current_popup.$(".exit").click(function(){
                self.gui.show_popup('block', {
                    confirm: function() {
                        var blocking = true;
                        self.click_username(blocking);
                    },
                });
            });
        },
    });

    return chrome;
});
