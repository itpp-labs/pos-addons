/* Copyright 2017-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Artem Losev
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_orders_history.db', function (require) {
    "use strict";
    var PosDB = require('point_of_sale.DB');


    PosDB.include({
        init: function (options) {
            this.order_search_string = "";
            this.sorted_orders = [];
            this.orders_history_by_id = {};
            this.line_by_id = {};
            this.pos_orders_history = [];
            this.pos_orders_history_lines = [];
            this._super.apply(this, arguments);
        },
        search_order: function(query){
            var re = '';
            try {
                query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g,'.');
                query = query.replace(' ','.+');
                re = RegExp("([0-9]+):.*?"+query,"gi");
            }catch(e){
                return [];
            }
            var results = [];
            for(var i = 0; i < this.limit; i++) {
                if (re) {
                    var r = re.exec(this.order_search_string);
                    if (r) {
                        var id = Number(r[1]);
                        var exist_order = this.orders_history_by_id[id];
                        if (exist_order) {
                            results.push(exist_order);
                        }
                    } else {
                        break;
                    }
                }
            }
            return results;
        },
        _order_search_string: function(order){
            var str = order.name;
            if(order.pos_reference){
                str += '|' + order.pos_reference;
            }
            if(order.partner_id){
                str += '|' + order.partner_id[1];
            }
            if(order.date_order){
                str += '|' + order.date_order;
            }
            if(order.user_id){
                str += '|' + order.user_id[1];
            }
            if(order.amount_total){
                str += '|' + order.amount_total;
            }
            if(order.state){
                str += '|' + order.state;
            }
            str = String(order.id) + ':' + str.replace(':','') + '\n';
            return str;
        },
        get_sorted_orders_history: function (count) {
            return this.sorted_orders.slice(0, count);
        },
        sorted_orders_history: function (orders) {
            var self = this;
            var orders_history = orders;
            function compareNumeric(order1, order2) {
                return order2.id - order1.id;
            }
            this.sorted_orders = orders_history.sort(compareNumeric);
            this.order_search_string = "";
            this.sorted_orders.forEach(function (order) {
                self.order_search_string += self._order_search_string(order);
            });
        },
    });
    return PosDB;
});
