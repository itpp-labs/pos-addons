odoo.define('pos_order_cancel_restaurant.tour', function(require) {
    "use strict";

    require("pos_order_cancel.tour");
    var core = require('web.core');
    var tour = require('web_tour.tour');
    var steps = tour.tours.pos_order_cancel_tour.steps;

    tour.tours.pos_order_cancel_tour.steps = steps.reduce(function(sum, step) {
        if (step.trigger === ".product-list .product") {
            sum.push({
                trigger: ".tables .table",
                content: "<p>Click <b>table</b></p>",
                position: "bottom",
                timeout: 20000,
            });
        }

        if (step.trigger === ".o_pos_kanban button.oe_kanban_action_button") {
            step.trigger = ".o_pos_kanban :has(div.o_primary:contains('Bar')) button.oe_kanban_action_button";
        }

        sum.push(step);
        return sum;
    }, []);

});
