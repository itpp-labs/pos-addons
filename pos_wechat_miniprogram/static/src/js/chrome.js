/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
   License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_wechat_miniprogram.chrome", function(require) {
    "use strict";

    var chrome = require("point_of_sale.chrome");

    chrome.OrderSelectorWidget.include({
        renderElement: function() {
            this._super();
            var order = this.pos.get_order();
            if (
                order &&
                order.miniprogram_order &&
                order.miniprogram_order.state === "done"
            ) {
                $(this.el).addClass("paid");
            } else {
                $(this.el).removeClass("paid");
            }
        },
    });

    return chrome;
});
