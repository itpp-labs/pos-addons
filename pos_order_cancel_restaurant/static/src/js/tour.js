/* Copyright 2017-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
 * Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_order_cancel_restaurant.tour', function(require) {
    "use strict";

    require("pos_order_cancel.tour");
    var core = require('web.core');
    var tour = require('web_tour.tour');
    var steps = tour.tours.pos_order_cancel_tour.steps;


    for (var position = 0; position < steps.length; position++) {
        if (steps[position].trigger === ".product-list .product") {
            steps.splice(
                position,
                1,
                {
                    trigger: ".tables .table",
                    content: "<p>Click <b>table</b></p>",
                    position: "bottom",
                    timeout: 20000,
                }, {
                    trigger: ".product-list .product",
                    content: "<p>Click product 1</p>",
                    position: "bottom",
                }
            );
            break;
        }

    }
});
