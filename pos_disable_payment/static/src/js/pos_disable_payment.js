openerp.pos_disable_payment = function(instance){
    var module = instance.point_of_sale;
    var _t = instance.web._t;

    module.PosWidget.include({
        init: function(){
            this._super.apply(this, arguments);
            this.pos.bind('change:selectedOrder', this.check_allow_delete_order, this)
        },
        check_allow_delete_order: function(){
            if (!this.pos.config.allow_delete_order){
                this.$('.deleteorder-button').toggle(this.pos.get_order().is_empty());
            }
        }
    })
    module.OrderSelectorWidget.include({
        renderElement: function(){
            this._super();
            this.pos_widget.check_allow_delete_order();
        }
    })

    module.OrderWidget.include({
        bind_order_events: function(){
            this._super();
            var order = this.pos.get('selectedOrder');
            order.orderlines.bind('add remove', this.pos_widget.check_allow_delete_order, this.pos_widget)
        }
    })

    module.ActionpadWidget.include({
        renderElement: function(){
            this._super();
           if (!this.pos.config.allow_payments){
               this.$('.pay').hide()
           }
         }
    })

    module.NumpadWidget.include({
        renderElement: function(){
            this._super();
            if (!this.pos.config.allow_discount){
                this.$el.find("[data-mode='discount']").css('visibility', 'hidden')
            }
            if (!this.pos.config.allow_edit_price){
                this.$el.find("[data-mode='price']").css('visibility', 'hidden')
            }
        }
    })

    module.NumpadWidget.include({
        clickDeleteLastChar: function(){
            if (!this.pos.config.allow_delete_order_line && this.state.get('buffer') === "" && this.state.get('mode') === 'quantity'){
                return;
            }
            return this._super();
        }
    })
}