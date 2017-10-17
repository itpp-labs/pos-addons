odoo.define('pos_multi_session.tour', function (require) {
    "use strict";

    var tour = require("web_tour.tour");

    function add_product_to_order(product_name) {
        return [{
            content: 'buy ' + product_name,
            trigger: '.product-list .product-name:contains("' + product_name + '")',
        }, {
            content: 'the ' + product_name + ' have been added to the order',
            trigger: '.order .product-name:contains("' + product_name + '")',
//            run: function () {}, // it's a check
        }];
    }

    var steps = [{
            content: 'waiting for loading to finish',
            trigger: '.neworder-button > .fa-plus',
        }];

    steps = steps.concat(add_product_to_order('Ekomurz.nl'));
    console.log(steps);

    tour.register('pos_tour', { test: true, url: '/pos/web' }, steps);

});
