odoo.define('pos_discount_total', function(require) {
'use strict';
var OrderWidget = require('point_of_sale.screens').OrderWidget;

    OrderWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent,options);
            this.discount_summary_selected = false;
            var line_click_handler = this.line_click_handler;
            this.line_click_handler = function(event){
                self.deselect_summary();
                line_click_handler.call(this, event);
            };
        },
        select_summary:function(){
            this.deselect_summary();
            this.discount_summary_selected = true;
            $('.order .summary').addClass('selected');
            this.numpad_state.reset();
            this.numpad_state.changeMode('discount');
        },
        deselect_summary:function(){
            this.discount_summary_selected = false;
            $('.order .summary').removeClass('selected');
        },
        set_value: function(val){
            var self = this;
            var order = this.pos.get_order();
          if (!order.get_selected_orderline()) {
                if (!this.discount_summary_selected)
                    return this._super(val);
                var mode = this.numpad_state.get('mode');
                if (mode=='discount'){
                    var order = this.pos.get('selectedOrder');
                    _.each(order.orderlines.models, function (model, index){
                        model.set_discount(val);
                    });
                }
            } else {
                return this._super(val);
            }
        },
        renderElement:function(scrollbottom){
            var self = this;
            this._super(scrollbottom);
            var node_el = $.Deferred();
            var checkSelector = setInterval(function () {
                if ($('.order .summary').length) {
                    node_el.resolve();
                    clearInterval(checkSelector);
                }
            }, 50);
            node_el.done(function () {
                $('.order .summary').on('click', function(event){
                    self.pos.get('selectedOrder').deselect_orderline(this.orderline);
                    self.numpad_state.reset();
                    self.select_summary();
                });
            });

        }
    });

});

