odoo.define('pos_logout.chrome', function (require) {
    "use strict";

    var chrome = require('point_of_sale.chrome');

    chrome.UsernameWidget.include({
        click_username: function(block) {
            this._super();
            var self = this;
            this.gui.current_popup.cashiers = true;
            // if (block) {
            //     this.gui.current_popup.block = true;
            // }
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

    chrome.Chrome.include({
        loading_hide: function() {
            this._super();
            var self = this;
            if (this.pos.config.logout_interval){
                function set_logout_interval(time){
                    time = time || self.pos.config.logout_interval * 1000;
                    if (time) {
                        self.pos.logout_timer = setTimeout(function(){
                            self.pos.gui.show_popup('block', {
                                confirm: function() {
                                    var blocking = true;
                                    self.pos.click_username(blocking);
                                },
                            });
                        }, time);
                    }
                }
                $(document).on('click', function(event){
                    clearTimeout(self.pos.logout_timer);
                    set_logout_interval();
                });
                set_logout_interval();
            }
        },
    });

    return chrome;
});
