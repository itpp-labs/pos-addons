openerp.pos_disable_restore_orders = function(instance){
    var module = instance.point_of_sale;
    var _t = instance.web._t;

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        load_orders: function(){
        }
  });
};