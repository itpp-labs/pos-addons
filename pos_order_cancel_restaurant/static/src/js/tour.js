odoo.define('pos_order_cancel_restaurant.tour', function(require) {
    "use strict";

    require("pos_order_cancel.tour");
    var core = require('web.core');
    var tour = require('web_tour.tour');
    var steps = tour.tours.pos_order_cancel_tour.steps;

    var _t = core._t;

    for (var position = 0; position < steps.length; position++) {
        if (steps[position].trigger === ".product-list .product") {
            steps.splice(
                position,
                0,
                {
                    trigger: ".tables .table",
                    content: _t("<p>Click <b>table</b></p>"),
                    position: "bottom"
                }
            );
            break;
        }

    }
});
