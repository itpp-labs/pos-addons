odoo.define("pos_category_multi.DB", function(require) {
    "use strict";

    var PosDB = require("point_of_sale.DB");

    PosDB.include({
        category_contains: function(categ_id, product_id) {
            this._super.apply(this, arguments);
            var product = this.product_by_id[product_id];
            if (product) {
                var cids = product.pos_category_ids;
                for (var i = 0; i < cids.length; i++) {
                    var cid = cids[i];
                    while (cid && cid !== categ_id) {
                        cid = this.category_parent[cid];
                    }
                    return Boolean(cid);
                }
            }
            return false;
        },
        is_product_in_category: function(category_ids, product_id) {
            var cats = this.get_product_by_id(product_id).pos_category_ids;
            for (var j = 0; j < cats.length; j++) {
                var cat = cats[j];
                while (cat) {
                    for (var i = 0; i < category_ids.length; i++) {
                        if (parseInt(cat, 10) === parseInt(category_ids[i], 10)) {
                            return true;
                        }
                    }
                    cat = this.get_category_parent_id(cat);
                }
            }
            return false;
        },
        add_products: function(products) {
            /* eslint-disable no-param-reassign */
            this._super.apply(this, arguments);
            var stored_categories = this.product_by_category_id;
            if (!products instanceof Array) {
                products = [products];
            }
            for (var i = 0, len = products.length; i < len; i++) {
                var product = products[i];
                var search_string = this._product_search_string(product);
                var categ_ids = product.pos_category_ids;
                if (categ_ids.length === 0) {
                    categ_ids = [this.root_category_id];
                }
                for (var n = 0; n < categ_ids.length; n++) {
                    var categ_id = categ_ids[n];
                    // Product.product_tmpl_id = product.product_tmpl_id[0];
                    if (!stored_categories[categ_id]) {
                        stored_categories[categ_id] = [];
                    }
                    stored_categories[categ_id].push(product.id);

                    if (typeof this.category_search_string[categ_id] === "undefined") {
                        this.category_search_string[categ_id] = "";
                    }
                    this.category_search_string[categ_id] += search_string;

                    var ancestors = this.get_category_ancestors_ids(categ_id) || [];

                    for (var j = 0, jlen = ancestors.length; j < jlen; j++) {
                        var ancestor = ancestors[j];
                        if (!stored_categories[ancestor]) {
                            stored_categories[ancestor] = [];
                        }
                        stored_categories[ancestor].push(product.id);

                        if (
                            typeof this.category_search_string[ancestor] === "undefined"
                        ) {
                            this.category_search_string[ancestor] = "";
                        }
                        this.category_search_string[ancestor] += search_string;
                    }
                }
            }
        },
    });
    return PosDB;
});
