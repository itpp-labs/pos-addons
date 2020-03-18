/* Copyright 2017 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License MIT (https://opensource.org/licenses/MIT). */

odoo.define("pos_multi_session_restaurant.tour", function(require) {
    "use strict";

    require("pos_multi_session.tour");
    var tour = require("web_tour.tour");

    var steps = tour.tours.tour_pos_multi_session.steps;

    var element = _.find(steps, function(step) {
        return (
            step.trigger ===
            ".o_pos_kanban :has(div.o_primary:contains('Multi Session Demo')) button.oe_kanban_action_button"
        );
    });

    steps.splice(steps.indexOf(element) + 1, 0, {
        content: "click on a table",
        trigger: ".table",
    });

    tour.register("open_pos_ms_r_tour", {test: true, url: "/web"}, steps);
});
