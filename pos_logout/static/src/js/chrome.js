/*  Copyright 2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
    Copyright 2017 Artyom Losev <https://github.com/ArtyomLosev>
    Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    Copyright 2020 Almas Giniatullin <https://it-projects.info/team/almas50>
    License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_logout.chrome", function (require) {
    "use strict";
    var chrome = require("point_of_sale.chrome");

    chrome.Chrome.include({
        loading_hide: function () {
            this._super();
            var self = this;
            var set_logout_interval = function (time) {
                time = time || self.pos.config.logout_interval * 1000;
                if (time) {
                    self.pos.logout_timer = setTimeout(function () {
                        self.pos.gui.show_screen("login");
                    }, time);
                }
            };
            if (this.pos.config.logout_interval) {
                $(document).on("click", function (event) {
                    clearTimeout(self.pos.logout_timer);
                    set_logout_interval();
                });
                set_logout_interval();
            }
        },
    });

    return chrome;
});
