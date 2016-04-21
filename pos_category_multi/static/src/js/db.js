odoo.define('pos_category_multi.DB', function (require) {
    "use strict";

    var PosDB = require('point_of_sale.DB');

    // TODO: optimize inheritance
    PosDB.include({
        category_contains: function(categ_id, product_id) {
            var product = this.product_by_id[product_id];
            if (product) {
                var cid = product.pos_category_multi_ids[0];
                while (cid && cid !== categ_id){
                    cid = this.category_parent[cid];
                }
                return !!cid;
            }
            return false;
        },
        is_product_in_category: function(category_ids, product_id) {
            if (!(category_ids instanceof Array)) {
                category_ids = [category_ids];
            }
            var cat = this.get_product_by_id(product_id).pos_category_multi_ids[0];
            while (cat) {
                for (var i = 0; i < category_ids.length; i++) {
                    if (cat == category_ids[i]) {   // The == is important, ids may be strings
                        return true;
                    }
                }
                cat = this.get_category_parent_id(cat);
            }
            return false;
        },
        add_products: function(products){
            var stored_categories = this.product_by_category_id;

            if(!products instanceof Array){
                products = [products];
            }
            for(var i = 0, len = products.length; i < len; i++){
                var product = products[i];
                var search_string = this._product_search_string(product);
                var categ_id = product.pos_category_multi_ids ? product.pos_category_multi_ids[0] : this.root_category_id;
                product.product_tmpl_id = product.product_tmpl_id[0];
                if(!stored_categories[categ_id]){
                    stored_categories[categ_id] = [];
                }
                stored_categories[categ_id].push(product.id);

                if(this.category_search_string[categ_id] === undefined){
                    this.category_search_string[categ_id] = '';
                }
                this.category_search_string[categ_id] += search_string;

                var ancestors = this.get_category_ancestors_ids(categ_id) || [];

                for(var j = 0, jlen = ancestors.length; j < jlen; j++){
                    var ancestor = ancestors[j];
                    if(! stored_categories[ancestor]){
                        stored_categories[ancestor] = [];
                    }
                    stored_categories[ancestor].push(product.id);

                    if( this.category_search_string[ancestor] === undefined){
                        this.category_search_string[ancestor] = '';
                    }
                    this.category_search_string[ancestor] += search_string;
                }
                this.product_by_id[product.id] = product;
                if(product.barcode){
                    this.product_by_barcode[product.barcode] = product;
                }
            }
        }
    });
    return PosDB;
});
