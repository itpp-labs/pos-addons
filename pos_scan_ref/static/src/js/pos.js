/*  Copyright 2014 Ivan Yelizariev  <https://it-projects.info/team/yelizariev >
    Copyright 2019 Artem Rafailov  <https://it-projects.info/team/Ommo73 >
    License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_scan_ref.pos', function (require) {
"use strict";

var devices = require('point_of_sale.devices');
var PosDb = require('point_of_sale.DB');
var models = require('point_of_sale.models');

models.PosModel = models.PosModel.extend({
    scan_product: function(parsed_code){
        var selectedOrder = this.get_order();
        if(parsed_code.encoding === 'reference'){
            var product = this.db.get_product_by_reference(parsed_code.code);
        }else if(this.db.get_product_by_barcode(parsed_code.base_code)){
            var product = this.db.get_product_by_barcode(parsed_code.base_code);
        }

        if(!product){
            return false;
        }

        if(parsed_code.type === 'price'){
            selectedOrder.add_product(product, {price:parsed_code.value});
        }else if(parsed_code.type === 'weight'){
            selectedOrder.add_product(product, {quantity:parsed_code.value, merge:false});
        }else if(parsed_code.type === 'discount'){
            selectedOrder.add_product(product, {discount:parsed_code.value, merge:false});
        }else{
            selectedOrder.add_product(product);
        }
        return true;
    },
});

devices.BarcodeReader.include({
    scan: function(code){
        if (!code) {
            return;
        }else if(this.pos.db.get_product_by_reference(code)){
            var parsed_result = {
                encoding: 'reference',
                type: 'product',
                code: code,
            };
            this.action_callback[parsed_result.type](parsed_result);
        }else if(this.barcode_parser.parse_barcode(code)){
            var parsed_result = this.barcode_parser.parse_barcode(code);
            if (this.action_callback[parsed_result.type]) {
                this.action_callback[parsed_result.type](parsed_result);
            } else if (this.action_callback.error) {
            this.action_callback.error(parsed_result);
            } else {
                console.warn("Ignored Barcode Scan:", parsed_result);
            }
        }
    }
});

PosDb.include({
    init: function(options){
        options = options || {};
        this.name = options.name || this.name;
        this.limit = options.limit || this.limit;

        if (options.uuid) {
            this.name = this.name + '_' + options.uuid;
        }

        //cache the data in memory to avoid roundtrips to the localstorage
        this.cache = {};

        this.product_by_id = {};
        this.product_by_barcode = {};
        this.product_by_category_id = {};
        this.product_by_reference = {};

        this.partner_sorted = [];
        this.partner_by_id = {};
        this.partner_by_barcode = {};
        this.partner_search_string = "";
        this.partner_write_date = null;

        this.category_by_id = {};
        this.root_category_id  = 0;
        this.category_products = {};
        this.category_ancestors = {};
        this.category_childs = {};
        this.category_parent    = {};
        this.category_search_string = {};
    },
    add_products: function(products){
        var stored_categories = this.product_by_category_id;

        if(!products instanceof Array){
            products = [products];
        }
        for(var i = 0, len = products.length; i < len; i++){
            var product = products[i];
            var search_string = this._product_search_string(product);
            var categ_id = product.pos_categ_id ? product.pos_categ_id[0] : this.root_category_id;
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
            if(product.default_code){
                this.product_by_reference[product.default_code] = product;
            }
        }
    },
    get_product_by_reference: function(ref){
        return this.product_by_reference[ref];
    },
})
});
