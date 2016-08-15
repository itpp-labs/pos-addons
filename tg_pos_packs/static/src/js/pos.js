function tg_pos_packs(instance, module){

    String.prototype.setCharAt = function(index,chr) {
        if(index > this.length-1) return str;
        return this.substr(0,index) + chr + this.substr(index+1);
    };

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        load_server_data: function(){
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded = loaded.then(function(){
                return self.fetch(
                    'product.product',
                    ['is_pack'],
                    [['sale_ok','=',true],['available_in_pos','=',true]],
                    {}
                );

            }).then(function(products){
                $.each(products, function(){
                    $.extend(self.db.get_product_by_id(this.id) || {}, this);
                });
                return $.when();
            });
            return loaded;
        },
    });

    var OrderSuper = module.Order;
    module.Order = module.Order.extend({
        addProduct: function(product, options){
            // if is_pack = false, this is a real product
            // we send it to the order
            options = options || {};
            if (options.pack_code){
                product = $.extend({'is_pack_item': options.is_pack_item,
                                    'is_pack_container': options.is_pack_container,
                                    'pack_code': options.pack_code
                                   },
                                   JSON.parse(JSON.stringify(product)));
                if (options.is_pack_container){
                    product.display_name = '■ ' + product.display_name;
                }
                if (options.is_pack_item){
                    product.display_name = '⁪├ ' + product.display_name;
                    product.price = 0;
                }
            }


            if(!product.is_pack || options.is_pack_container)
                return OrderSuper.prototype.addProduct.call(this, product, options);
            // this is a Pack !!
            this.show_screen_pack(product.display_name);

            // get templates
            this.get_templates(product.id);
        },

        get_templates: function(pack_id){
            var self = this;
            var grp_list = [];
            var tmpl_list = [];
            var grp_id = 0;
            var item_number = 0;

            var loaded = self.pos.fetch('product.pack',['item_tmpl_id', 'group_id'],[['product_id','=', parseInt(pack_id)]])
                .then(function(groupe_tmpl){

                    for(var i = 0, len = groupe_tmpl.length; i < len; i++){

                        // // pack lines
                        if(groupe_tmpl[i].group_id != grp_id){
                            grp_id = groupe_tmpl[i].group_id;
                            var one_pack = new module.PackWidget(this, {});
                            one_pack.appendTo($('#packs-list'));

                            item_number++;
                            one_pack.$('.item_number').html(item_number);
                            one_pack.$('.pack_item_select').attr('id', 'p_' + grp_id);

                            var sel_variant_id = 'v_' + grp_id;
                                one_pack.$('.pack_product_select').attr('id', sel_variant_id);

                            one_pack.$('.pack_item_select').change(function(){
                                var product_tmpl_id = this.value;
                                var sel_id = $(this).attr('id');
                                sel_id = sel_id.setCharAt(0, 'v');
                                self.get_variant(product_tmpl_id, sel_id);
                            });
                        }

                        var content = one_pack.$('.pack_item_select').html();
                        var new_option = '<option value="' + groupe_tmpl[i].item_tmpl_id[0] + '">' + groupe_tmpl[i].item_tmpl_id[1] + '</option>\n';
                        one_pack.$('.pack_item_select').html(content + new_option);
                    }

                    for(var i = 1; i <= grp_id; i++){
                        $('#p_' + i).change();
                    }

                    // items count
                    $('#input_nb_items').val(grp_id);

                    //pack_id
                    $('#pack_product_id').val(pack_id);
                });
        },
        get_variant: function(product_tmpl_id, sel_variant_id){
            var self = this;
            var product_list = [];

            var loaded = self.pos.fetch('product.product', ['display_name', 'id'],
                                     [['sale_ok','=',true],
                                      ['available_in_pos','=',true],
                                      ['product_tmpl_id', '=', parseInt(product_tmpl_id)]
                                     ])
                .then(function(products){

                    // remove all previouses options
                    $('#' + sel_variant_id).find('option').remove().end();

                    // add all products
                    for(var i = 0, len = products.length; i < len; i++){
                        var content = $('#' + sel_variant_id).html();
                        var new_option = '<option value=\'' + products[i].id + '\'>' + products[i].display_name + '</option>\n';
                        $('#' + sel_variant_id).html(content + new_option);
                    }
                });

        },

        add_products_from_pack: function(){
            var self = this;
            var nb_items = $('#input_nb_items').val();
            var selectedOrder = this.pos.get('selectedOrder');

            var pack_id = $('#pack_product_id').val();
            var pack_product = null;
            var pack_code = 'pack-'+pack_id+'-'+new Date().getTime();

            pack_product = self.pos.db.get_product_by_id(parseInt(pack_id));

            // add pack product to the order
            if(pack_product){
                selectedOrder.addProduct(pack_product, {'is_pack_container':1, 'pack_code': pack_code});

                var cur_oline = selectedOrder.getSelectedLine();

            }

            for(var i = 1; i <= nb_items; i++){
                var field = $('#v_' + i);
                var product_id = parseInt(field.val());
                var product = self.pos.db.get_product_by_id(product_id);

                //add products to the order
                if(product){
                    selectedOrder.addProduct(product, {is_pack_item:1, 'pack_code': pack_code});
                }
            }

            self.hide_screen_pack();
        },

        show_screen_pack: function(product){
            var self = this;

            // remove previous lines
            $('#packs-list tr').remove();

            $('#pack_name').html(product);
            $('#cache_left_pane').css('display', 'block');
            $('#cache-header-cust').css('display', 'block');
            $('#id-clientscreenwidget').css('display', 'none');
            $('.screens').css('display', 'none');
            $('#id_salesscreen').css('display', 'none');
            $('#pack_screen').css('display', 'block');

            $('#input_cancel_pack').click(function(){
                self.hide_screen_pack();
            });

            $('#input_add_pack').unbind('click');

            $('#input_add_pack').click(function(){
                self.add_products_from_pack();
            });
        },

        hide_screen_pack: function(){
            $('#cache_left_pane').css('display', 'none');
            $('#cache-header-cust').css('display', 'none');
            $('.screens').css('display', 'block');
            $('#pack_screen').css('display', 'none');
        },

        selectLine: function(line){
            if (!line || line.get_product().is_pack_item || line.is_pack_container){
                //TODO don't allow return product
            }
            return OrderSuper.prototype.selectLine.call(this, line);
        }

    });

    var OrderlineSuper = module.Orderline;
    module.Orderline = module.Orderline.extend({
        /*
        initialize: function(attr, options){
            OrderlineSuper.prototype.initialize.call(attr, options)
        },
         */
        set_quantity: function(quantity){
            var self = this;
            var product = this.get_product();

            quantity = quantity || 'remove';
            if(quantity === 'remove'){

                // when we remove a pack
                // we have too remove items too !
                if(product.is_pack_container){

                    var o_lines = [];
                    var cur_order = this.pos.get('selectedOrder');
                    var sel_line = cur_order.selected_orderline;

                    (cur_order.get('orderLines')).each(_.bind( function(item) {
                        return o_lines.push(item);
                    }, this));

                    for(var i = 0,  len = o_lines.length; i < len; i++){
                        if (o_lines[i].get_product().pack_code == product.pack_code){
                            this.order.removeOrderline(o_lines[i]);
                        }
                    }

                }
                return OrderlineSuper.prototype.set_quantity.call(this, quantity);
            }else{

                // packages must be sold one by one
                if(!product.pack_code){
                    return OrderlineSuper.prototype.set_quantity.call(this, quantity);
                }
            }
        },

        // when we add an new orderline we want to merge it with the last line to see reduce the number of items
        // in the orderline. This returns true if it makes sense to merge the two
        can_be_merged_with: function(orderline){
            // do not merge if this is an item of the pack nor if this is a return (for visual)
            if(this.get_product().is_pack_item || this.is_return == true){
                return false;
            }
            return OrderlineSuper.prototype.can_be_merged_with.call(this, orderline);
        },


    });

    module.PackScreenWidget = module.ScreenWidget.extend({
        template: 'PackScreenWidget',

        init: function(parent, options){
            this._super(parent);
            var  self = this;
        },

        renderElement: function(){
            var self = this;
            this._super();
/*
            this.scrollbar = new module.ScrollbarWidget(this,{
                target_widget:   this,
                target_selector: '.cust-list-scroller',
                on_show: function(){
                    self.$('.cust-list-scroller').css({'padding-right':'0px'},100);
                },
                on_hide: function(){
                    self.$('.cust-list-scroller').css({'padding-right':'0px'},100);
                },
            });

            this.scrollbar.replace(this.$('.placeholder-ScrollbarWidget'));
*/
            this.$('#cs-salesclosebtn').click(function(){
                self.close_sales_window();
            });
        },
    });

    module.PosWidget.include({
        template: 'PosWidget',
        build_widgets: function() {
            var self = this;
            this._super();
            this.pack = new module.PackScreenWidget(this, {});
            this.pack.prependTo($('.rightpane>.window>.subwindow>.subwindow-container'));


        }
    });
    module.PackWidget = module.ScreenWidget.extend({
        template: 'PackWidget',

        init: function(parent, options) {
            this._super(parent);
            var  self = this;
        },

    });
}

(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;

        tg_pos_packs(instance, module);

        $('<link rel="stylesheet" href="/tg_pos_packs/static/src/css/pos.css"/>').appendTo($("head"));
    };
})();