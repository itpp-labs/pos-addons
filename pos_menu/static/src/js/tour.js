odoo.define('pos_menu.tour', function(require) {
    "use strict";

    var core = require('web.core');
    var tour = require('web_tour.tour');

    var _t = core._t;

    function pos_opening(){
      return [{
        trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
        content: _t("Ready to launch your <b>point of sale</b>? <i>Click here</i>."),
        position: 'bottom',
      }, {
        trigger: ".o_pos_kanban .o_kanban_record:not(:first) button.oe_kanban_action_button",
        content: _t("<p>Click to start the point of sale interface. It <b>runs on tablets</b>, laptops, or industrial hardware.</p><p>Once the session launched, the system continues to run without an internet connection.</p>"),
        position: "bottom"
      }, {
        trigger: '.o_main_content:has(.loader:hidden)',
        content: 'Wait for loading is finished',
        timeout: 20000,
        run: function () {
            // it's a check
          },
        }];
      }

      function check_menu(menu){
        return [{
          content: "Switch to table or make dummy action",
          trigger: '.table:not(.oe_invisible .neworder-button), .order-button.selected',
          position: "bottom"
        }, {
          trigger: '.product-list .product-name:contains()',
          content: "Add products",
          position: "top",
          run: function(){
              for (var i = 0; i < menu.length; i++) {
                $('.product-list .product-name:contains(' + menu[i] + ')').click();
              }
            },
          }];
        }

      function pos_closing(){
        return [{
          trigger: ".header-button",
          content: "close the Point of Sale frontend",
        }, {
          trigger: ".header-button.confirm",
          content: "confirm closing the frontend",
        }, {
          content: "wait until backend is opened",
          trigger: '.o_app[data-menu-xmlid="point_of_sale.menu_point_root"], .oe_menu_toggler[data-menu-xmlid="point_of_sale.menu_point_root"]',
          run: function () {
              // no need to click on trigger
            },
          }];
        }

        var steps = [];
        var menu = ["Boni Oranges", "Black Grapes", "Carrots", "Conference pears"];
        steps = steps.concat(pos_opening());
        steps = steps.concat(check_menu(menu));
        steps = steps.concat(pos_closing());

        tour.register('pos_menu_tour', {url: '/web', test: true,}, steps);
});
