odoo.define('pos_category_multi.models', function (require) {
    "use strict";

    var PosDB = require('pos_category_multi.DB');
    var exports = require('point_of_sale.models');

    // overrides PosDB in exports.PosModel
    var _super_posmodel = exports.PosModel.prototype;
    exports.PosModel = exports.PosModel.extend({
        initialize: function (session, attributes) {
            _super_posmodel.initialize.apply(this, arguments);
            this.db = new PosDB();
        }
    });

    // overrides models in exports.PosModel
    var models = exports.PosModel.prototype.models;
    for (var i = 0; i <= models.length; i++) {
        var item = models[i];
        if (item.model == 'product.product') {
            for (var j = 0; j <= item.fields.length; j++) {
                if(item.fields[j] == 'pos_categ_id'){
                    item.fields[j] = 'pos_category_multi_ids';
                    break;
                }
            }
            break;
        }
    }
    console.log('export:', exports);

    return exports;
});
