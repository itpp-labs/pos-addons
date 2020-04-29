odoo.define("pos_mobile_restaurant.gui", function(require) {
    "use strict";

    if (!odoo.is_mobile) {
        return;
    }

    var gui = require("pos_mobile.gui");

    gui.Gui.include({
        change_screen_type: function(current_screen) {
            var swiper_floor_container = $(".swiper-container-floor-screen");
            if (current_screen === "floors") {
                swiper_floor_container.addClass("mobile-active-screen");
                swiper_floor_container.css({display: ""});
                this.chrome.change_current_floor();
            } else {
                swiper_floor_container.removeClass("mobile-active-screen");
                swiper_floor_container.css({display: "none"});
            }
            this._super(current_screen);
        },
    });
    return gui;
});
