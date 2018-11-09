odoo.define('pos_order_cancel_restaurant.tour', function(require) {
    "use strict";

    require("pos_order_cancel.tour");
    var tour = require('web_tour.tour');
    var steps = tour.tours.pos_order_cancel_tour.steps;

    for (var position = 0; position < steps.length; position++) {
        if (steps[position].trigger === ".numpad-backspace") {
            steps.splice(
                position,
                0,
                {
                    trigger: ".order-submit",
                    content: "Send the order to kitchen",
                    position: "bottom"
                }
            );
            break;
        }

    }
});
