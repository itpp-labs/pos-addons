odoo.define('to_pos_shared_floor', function (require) {
"use strict";

require('pos_restaurant.floors');
var core = require('web.core');
var models = require('point_of_sale.models');

var QWeb = core.qweb;
var _t = core._t;


//load floors with a different domain
models.load_models({
    model: 'restaurant.floor',
    fields: ['name','background_color','table_ids','sequence'],
    domain: function(self){ return [['id','in',self.config.floor_ids]]; },
    loaded: function(self,floors){
        self.floors = floors;
        self.floors_by_id = {};
        for (var i = 0; i < floors.length; i++) {
            floors[i].tables = [];
            self.floors_by_id[floors[i].id] = floors[i];
        }

        // Make sure they display in the correct order
        self.floors = self.floors.sort(function(a,b){ return a.sequence - b.sequence; });

        // Ignore floorplan features if no floor specified.
        self.config.iface_floorplan = !!self.floors.length;
    },
});

// reload tables. No changes here, but we have to repeat it as list of floors is updated
models.load_models({
    model: 'restaurant.table',
    fields: ['name','width','height','position_h','position_v','shape','floor_id','color','seats'],
    loaded: function(self,tables){
        self.tables_by_id = {};
        for (var i = 0; i < tables.length; i++) {
            self.tables_by_id[tables[i].id] = tables[i];
            var floor = self.floors_by_id[tables[i].floor_id[0]];
            if (floor) {
                floor.tables.push(tables[i]);
                tables[i].floor = floor;
            }
        }
    },
});

});
