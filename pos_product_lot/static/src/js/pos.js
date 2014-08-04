(function(){

// from http://vk.com/js/common.js
function geByClass(searchClass, node, tag) {
  var classElements = new Array();
  if (node == null)
    node = document;
  if (tag == null)
    tag = '*';
  if (node.getElementsByClassName) {
    classElements = node.getElementsByClassName(searchClass);
    if (tag != '*') {
      for (i = 0; i < classElements.length; i++) {
        if (classElements.nodeName == tag)
          classElements.splice(i, 1);
      }
    }
    return classElements;
  }
  var els = node.getElementsByTagName(tag);
  var elsLen = els.length;
  var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
  for (i = 0, j = 0; i < elsLen; i++) {
    if ( pattern.test(els[i].className) ) {
      classElements[j] = els[i];
      j++;
    }
  }
  return classElements;
}

function pos(instance, module){
    var PosModelSuper = module.PosModel
    module.PosModel = module.PosModel.extend({
        load_server_data: function(){
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded = loaded.then(function(){
                return self.fetch(
                    'product.product',
                    ['is_lot', 'lot_qty', 'lot_product_id', 'lot_id'],
                    [['sale_ok','=',true],['available_in_pos','=',true]],
                    {}
                );
            }).then(function(products){
                $.each(products, function(){
                    $.extend(self.db.get_product_by_id(this.id) || {}, this)
                })
                return $.when()
            })
            return loaded;
        },
        scan_product: function(parsed_code){
            var self = this;
            var selectedOrder = this.get('selectedOrder');
            if(parsed_code.encoding === 'ean13'){
                var product = this.db.get_product_by_ean13(parsed_code.base_code);
            }else if(parsed_code.encoding === 'reference'){
                var product = this.db.get_product_by_reference(parsed_code.code);
            }

            if(!product){
                return false;
            }

            //added code
            if (product.lot_id){
                var lot_product = this.db.get_product_by_id(product.lot_id[0])
                if (lot_product.ean13==parsed_code.base_code)
                    //lot with same ean has priority
                    product = lot_product;
            }

            if(parsed_code.type === 'price'){
                selectedOrder.addProduct(product, {price:parsed_code.value});
            }else if(parsed_code.type === 'weight'){
                selectedOrder.addProduct(product, {quantity:parsed_code.value, merge:false});
            }else if(parsed_code.type === 'discount'){
                selectedOrder.addProduct(product, {discount:parsed_code.value, merge:false});
            }else{
                selectedOrder.addProduct(product);
            }
            return true;
        },

    })

    module.OrderWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent,options);

            this.unpack_lot_handler = function(){
                var product = this.orderline.product;
                var lot_product = self.pos.db.get_product_by_id(product.lot_id[0]);

                lot_product.qty_available -= 1;
                product.qty_available += lot_product.lot_qty;

                self.rerender_orderline(this.orderline);
                self.pos.refresh_qty_available(product);
                self.pos.refresh_qty_available(lot_product);
            }
        },
        render_orderline: function(orderline){
            var el_node = this._super(orderline);
            var button = geByClass('unpack-lot', el_node)
            if (button && button.length){
                button = button[0]
                button.orderline = orderline;
                button.addEventListener('click', this.unpack_lot_handler)
            }

            return el_node;
        },
    })

}

var _super = window.openerp.point_of_sale;
window.openerp.point_of_sale = function(instance){
    _super(instance);
    var module = instance.point_of_sale;

    pos(instance, module);

    $('<link rel="stylesheet" href="/pos_product_lot/static/src/css/pos.css"/>').appendTo($("head"))
}

})()