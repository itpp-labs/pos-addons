odoo.define("pos_menu", function(require) {
    "use strict";
    var models = require("point_of_sale.models");

    models.load_models(
        [
            {
                model: "pos.tag",
                field: [],
                domain: function() {
                    return [["pos_ids", "in", self.posmodel.config.id]];
                },
                loaded: function(self, tags) {
                    // Save the tags for current POS
                    self.tags = tags;
                    // If tag_ids are not specified in the POS Setting then we load all products for the POS
                    // otherwise we add new domain
                    if (self.config.tag_ids && self.config.tag_ids.length) {
                        self.models.forEach(function(model) {
                            if (model.model === "product.product") {
                                model.domain.push([
                                    "tag_ids",
                                    "in",
                                    self.config.tag_ids,
                                ]);
                            }
                        });
                    }
                },
            },
        ],
        {
            before: "product.product",
        }
    );
});
