odoo.define('pos_category_multi.screens', function(require){
    "use strict";
    var screens = require('point_of_sale.screens');

    screens.ProductCategoriesWidget.include({
        perform_search: function(category, query, buy_result) {
            this._super(category, query, buy_result);
            if(query){
                var products = this.pos.db.search_product_in_category(category.id, query);
                var getUniqueByID = function getUniqueByID(arr) {
                    var unique = arr.map(function (e) {
                        return e.id;
                    }).map(function (e, i, final) {
                        return final.indexOf(e) === i && i;
                    }).filter(function (e) {
                        return arr[e];
                    }).map(function (e) {
                        return arr[e];
                    });
                    return unique;
                };
                products = getUniqueByID(products);
                if(buy_result && products.length === 1){
                        this.pos.get_order().add_product(products[0]);
                        this.clear_search();
                }else{
                    this.product_list_widget.set_product_list(products);
                }
            }
        },
    });

    return screens;
});
