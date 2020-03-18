odoo.define("pos_category_multi.models", function(require) {
    "use strict";

    var exports = require("point_of_sale.models");

    // Overrides models in exports.PosModel
    var models = exports.PosModel.prototype.models;
    for (var i = 0; i <= models.length; i++) {
        var item = models[i];
        if (item.model === "product.product") {
            for (var j = 0; j <= item.fields.length; j++) {
                if (item.fields[j] === "pos_categ_id") {
                    item.fields[j] = "pos_category_ids";
                    break;
                }
            }
            break;
        }
    }

    return exports;
});
