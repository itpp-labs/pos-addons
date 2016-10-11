odoo.define('to_pos_shared_floor', function (require) {
"use strict";

require('pos_restaurant.floors');
var core = require('web.core');
var models = require('point_of_sale.models');

var QWeb = core.qweb;
var _t = core._t;


//load floors with a different domain
var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({
    initialize: function (session, attributes) {
        var floor_model = _.find(this.models, function(model){ return model.model === 'restaurant.floor'; });
        floor_model.domain = function(self){ return [['id','in',self.config.floor_ids]]; };
        return _super_posmodel.initialize.call(this, session, attributes);
    }
});

});
