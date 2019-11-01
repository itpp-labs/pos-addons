/*  Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
    Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_orders_history_return.tour', function(require) {
    "use strict";

    var tour = require('web_tour.tour');
    var HistoryTour = require('pos_orders_history.tour');

    function return_order() {
        return [{
            trigger: '.order-line:first .button.return',
            content: "return selected order",
        }];
    }

    var hist_tour = new HistoryTour();
    var steps = [].concat(
        hist_tour.open_pos_steps(),
        hist_tour.create_order_steps(),
        hist_tour.create_order_steps(),
        hist_tour.orders_history(),
        return_order(),
        hist_tour.add_product_to_order('LED Lamp'),
        hist_tour.goto_payment_screen_and_select_payment_method(),
        hist_tour.finish_order(),
        hist_tour.close_pos()
    );

    tour.register('pos_orders_history_return_tour', {test: true, url: '/web' }, steps);
});
