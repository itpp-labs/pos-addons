/* Copyright 2017-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
 * Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
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
