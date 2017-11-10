odoo.define('pos_mobile_restaurant.tour', function(require) {
    "use strict";

    require("pos_mobile.tour");
    var core = require('web.core');
    var tour = require('web_tour.tour');
    var steps = tour.tours.pos_mobile_tour.steps;

    steps.push(
        {
            trigger: ".tables .table",
            content: "<p>Click <b>table</b></p>",
            position: "bottom"
        }
    );
});
