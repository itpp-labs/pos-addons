/*  Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
    Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_orders_history.tour', function(require) {
    "use strict";

    var tour = require('web_tour.tour');
    var core = require('web.core');

    var HistoryTour = core.Class.extend({

        init: function (product_name) {
            this.product_name = product_name || 'Peaches';
        },

        add_product_to_order: function(product_name) {
            product_name = product_name || this.product_name;
            return [{
                trigger: '.product-list .product-name:contains("' + product_name + '")',
                content: 'buy ' + product_name,
            }, {
                trigger: '.order .product-name:contains("' + product_name + '")',
                content: 'the ' + product_name + ' have been added to the order',
                run: function () {
                    // it's a check
                },
            }];
        },

        cashier_select: function() {
            return [{
                trigger: '.modal-dialog.cashier .selection-item:contains("Admin")',
                content: 'select first cashier',
            }];
        },

        goto_payment_screen_and_select_payment_method: function() {
            var steps = [{
                trigger: '.button.pay',
                content: "go to payment screen",
            }];
            if (odoo._modules.indexOf('pos_cashier_select') !== -1) {
                steps = steps.concat(this.cashier_select());
            }
            steps = steps.concat([{
                trigger: '.paymentmethod:contains("Cash (USD)")',
                content: "pay with cash",
            }]);
            return steps;
        },

        generate_keypad_steps: function(amount_str, keypad_selector) {
            var i = 0, steps = [], current_char = false;
            for (i = 0; i < amount_str.length; ++i) {
                current_char = amount_str[i];
                steps.push({
                    trigger: keypad_selector + ' .input-button:contains("' + current_char + '"):visible',
                    content: 'press ' + current_char + ' on payment keypad',
                });
            }

            return steps;
        },

        generate_payment_screen_keypad_steps: function(amount_str) {
            return this.generate_keypad_steps(amount_str, '.payment-numpad');
        },

        finish_order: function() {
            return [{
                trigger: '.button.next.highlight:visible',
                content: "validate the order",
            }, {
                trigger: '.button.next:visible',
                content: "next order",
            }].concat(
                this.select_table(0, 3)
            );
        },

        orders_history: function(product_name) {
            product_name = product_name || this.product_name;
            return [{
                trigger: '.control-button.orders-history',
                content: "open orders history screen",
            }, {
                trigger: ".order-line td:first",
                content: "open fist order",
            }, {
                trigger: ".line-element-container:first .line-line:contains(" + product_name + ")",
                run: function () {
                    // it's a check
                },
            }];
        },

        open_pos_kanban: function() {
            return [{
                trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
                content: "Ready to launch your point of sale",
                position: 'bottom',
            }];
        },

         open_pos: function() {
            return [{
                trigger: ".o_pos_kanban button.oe_kanban_action_button",
                content: "<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>",
                position: "bottom"
            }].concat(
                this.select_table(20000)
            );
        },

        select_table: function(timeout, qty) {
            var steps = [];
            qty = qty || 1;
            for (var i = 0; i < qty; i++) {
                steps[i] = {
                    content: "Switch to table or make dummy action",
                    trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
                    position: "bottom"
                };
            }
            if (timeout) {
                steps[0].timeout = timeout;
            }
            return steps;
        },

        close_pos: function() {
            return [{
                trigger: '.header-button:contains("Close")',
                content: "Close POS",
            }, {
                trigger: '.header-button.confirm:contains("Confirm")',
                content: "Close POS",
            }, {
                extra_trigger: ".o_pos_kanban button.oe_kanban_action_button",
                trigger: '.breadcrumb li.active',
                content: "Dummy click",
                position: "bottom",
            }];
        },

        open_pos_steps: function() {
            return [].concat(
                this.open_pos_kanban(),
                this.open_pos()
            );
        },

        fetch_history: function () {
            return [{
                trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
                content: 'Fetching Orders',
                run: function () {
                    // we fetch orders in id range 0-99
                    window.posmodel.on_orders_history_updates({updated_orders: _.range(0, 100, 1)}).then(function(res){
                        console.log('Orders History was downloaded');
                        console.log("RES:", res);
                    });
                },
            }].concat(
                this.select_table(0, 2)
            );
        },

        create_order_steps: function() {
            return [].concat(
                this.select_table(),
                this.add_product_to_order(),
                this.goto_payment_screen_and_select_payment_method(),
                this.generate_payment_screen_keypad_steps("9"),
                this.finish_order(),
                this.select_table()
            );
        },
    });

    var hist_tour = new HistoryTour();
    // we make two orders in order to test fetch_history handlers
    var steps = [].concat(
        hist_tour.open_pos_steps(),
        hist_tour.create_order_steps(),
        hist_tour.create_order_steps(),
        hist_tour.fetch_history(),
        hist_tour.orders_history()
    );

    tour.register('pos_orders_history_tour', {test: true, url: '/web' }, steps);

    return HistoryTour;
});
