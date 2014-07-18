function pos_discount_widgets(instance, module){
    module.OrderWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent,options);
            this.summary_selected = false;

            var line_click_handler = this.line_click_handler;
            this.line_click_handler = function(event){
                self.deselect_summary();
                line_click_handler.call(this, event)
            }
        },
        select_summary:function(){
            if (this.summary_selected)
                return;
            this.deselect_summary();
            this.summary_selected = true;
            $('.order .summary').addClass('selected')
            this.pos_widget.numpad.state.reset();
            this.pos_widget.numpad.state.changeMode('discount');
        },
        deselect_summary:function(){
            this.summary_selected = false;
            $('.order .summary').removeClass('selected')
        },
        set_value: function(val){
            if (!this.summary_selected)
                return this._super(val);
            var mode = this.numpad_state.get('mode');
            if (mode=='discount'){
                var order = this.pos.get('selectedOrder');
                $.each(order.get('orderLines').models, function (k, line){
                    line.set_discount(val)
                })
            }
        },
        renderElement:function(scrollbottom){
            var self = this;
            this._super(scrollbottom);

            $('.order .summary').click(function(event){
                if(!self.editable){
                    return;
                }
                self.pos.get('selectedOrder').deselectLine(this.orderline);
                self.pos_widget.numpad.state.reset();

                self.select_summary()
            })
        }
    })
}

(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;

        pos_discount_widgets(instance, module);

        $('<link rel="stylesheet" href="/pos_discount/static/src/css/pos.css"/>').appendTo($("head"))
    }
})()
