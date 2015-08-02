openerp.pos_disable_payment = function(instance){
    var module = instance.point_of_sale;
    var _t = instance.web._t;
    module.PaypadWidget.include({
        renderElement: function(){
            this._super();
           if (!this.pos.config.allow_payments){
               this.$el.empty();
           }
         }
    })

}