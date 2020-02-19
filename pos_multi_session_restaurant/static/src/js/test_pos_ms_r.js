/* Copyright 2017,2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License MIT (https://opensource.org/licenses/MIT). */

odoo.define("pos_multi_session_restaurant.tour", function(require) {
    "use strict";

    require("pos_multi_session.tour");
    var tour = require("web_tour.tour");

    var steps = tour.tours.tour_pos_multi_session.steps;

    var element = _.find(steps, function(step) {
        return step.trigger === ".pos-branding";
    });

    steps.splice(steps.indexOf(element) + 1, 0, {
        content: "Switch to table or make dummy action",
        trigger: ".table:not(.oe_invisible .neworder-button), .order-button.selected",
    });

    tour.register("open_pos_ms_r_tour", {test: true, url: "/web"}, steps);
});
