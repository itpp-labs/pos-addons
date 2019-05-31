/*  Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
    Copyright 2017 Artyom Losev <https://github.com/ArtyomLosev>
    Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_logout.chrome', function (require) {
    "use strict";

    var chrome = require('point_of_sale.chrome');

    chrome.UsernameWidget.include({
        click_username: function(block) {
            this._super();
            var self = this;
            this.gui.current_popup.cashiers = true;
            this.gui.current_popup.renderElement();
            this.gui.current_popup.$(".exit").click(function(){
                self.gui.show_popup('block');
            });
            this.gui.current_popup.cashiers = false;
        },
    });

    chrome.Chrome.include({
        loading_hide: function() {
            this._super();
            var self = this;
            var set_logout_interval = function(time){
                time = time || self.pos.config.logout_interval * 1000;
                if (time) {
                    self.pos.logout_timer = setTimeout(function(){
                        self.pos.gui.show_popup('block');
                    }, time);
                }
            };
            if (this.pos.config.logout_interval){
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
