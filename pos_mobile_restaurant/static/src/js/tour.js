odoo.define('pos_mobile_restaurant.tour', function(require) {
    "use strict";

    require("pos_mobile.tour");
    var tour = require('web_tour.tour');
    var steps = tour.tours.pos_mobile_tour.steps;

    for (var position = 0; position < steps.length; position++) {
        if (steps[position].trigger === ".o_main_content:has(.loader:hidden)") {
            steps.splice(
                position + 1,
                0,
                {
                    trigger: ".tables .table",
                    content: "<p>Click <b>table</b></p>",
                    position: "bottom"
                }
            );
            break;
        }
    }
});
