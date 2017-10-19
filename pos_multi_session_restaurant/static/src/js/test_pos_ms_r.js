odoo.define('pos_multi_session_restaurant.tour', function (require) {
    "use strict";

    require("pos_multi_session.tour")
    var tour = require("web_tour.tour");

    var steps = tour.tours.open_pos_tour.steps;

    var element = steps.find(function(step){
        return step.trigger === ".o_pos_kanban button.oe_kanban_action_button";
    });

    steps.splice(steps.indexOf(element) + 1,
    0, {
        content: "click on a table",
        trigger: ".table > .label:contains('T9')",
    });

    tour.register('open_pos_ms_r_tour', { test: true, url: '/web?debug=assets#' }, steps);

});
