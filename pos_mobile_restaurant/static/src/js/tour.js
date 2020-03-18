odoo.define("pos_mobile_restaurant.tour", function(require) {
    "use strict";

    require("pos_mobile.tour");
    var tour = require("web_tour.tour");
    var steps = tour.tours.pos_mobile_tour.steps;

    for (var position = 0; position < steps.length; position++) {
        if (
            steps[position].trigger ===
            ".table:not(.oe_invisible .neworder-button), .order-button.selected"
        ) {
            steps.splice(position + 1, 0, {
                trigger: ".popup-number .confirm",
                content: "Click guest confirm",
                position: "bottom",
            });
            break;
        }
    }
});
