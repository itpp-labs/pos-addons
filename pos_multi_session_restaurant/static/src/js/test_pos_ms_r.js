/* Copyright 2017 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */

odoo.define('pos_multi_session_restaurant.tour', function (require) {
    "use strict";

    require("pos_multi_session.tour");
    var tour = require("web_tour.tour");

    var steps = tour.tours.tour_pos_multi_session.steps;

    var element = _.find(steps, function(step){
        return step.trigger === ".o_pos_kanban :has(div.o_primary:contains('Bar')) button.oe_kanban_action_button";
    });

    steps.splice(steps.indexOf(element) + 1,
    1, {
        content: "click on a table",
        trigger: ".table",
        timeout: 20000,
    }, {
        content: 'waiting for loading to finish',
        trigger: '.neworder-button > .fa-plus',
    });

    tour.register('open_pos_ms_r_tour', { test: true, url: '/web' }, steps);

});
