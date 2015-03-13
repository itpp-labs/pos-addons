function pos_product_available(instance, module){

    var PosModelSuper = module.PosModel
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
                    $.extend(self.db.get_product_by_id(this.id) || {}, this)
                });
                return $.when()
            })
            return loaded;
        },
    })

    var OrderSuper = module.Order;
    module.Order = module.Order.extend({
        addProduct: function(product, options){
            // if is_pack = false, this is a real product
            // we send it to the order
            var attr = JSON.parse(JSON.stringify(product));

            if(!attr.is_pack)
                return OrderSuper.prototype.addProduct.call(this, product, options)

            // this is a Pack !!
            this.show_screen_pack(attr.name);

            // get templates
            this.get_templates(attr.id);
        },

        get_templates: function(pack_id){
            var self = this;
            var grp_list = [];
            var tmpl_list = [];
            var grp_id = 0;
            var item_number = 0;

            var loaded = fetch('product.pack',['item_tmpl_id', 'group_id'],[['product_id','=', parseInt(pack_id)]])
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

        add_products_from_pack: function(){
            var self = this;
            var nb_items = $('#input_nb_items').val();
            var selectedOrder = this.pos.get('selectedOrder');

            var pack_id = $('#pack_product_id').val()
            var pack_product = null;

            pack_product = self.pos.db.get_product_by_id(parseInt(pack_id));

            // add pack product to the order
            if(pack_product){
                var is_pack_previous = pack_product.is_pack;
                var pack_name = pack_product.name;

                pack_product.is_pack = false;
                pack_product.name = '■ ' + pack_product.name;

                var m_pack_product = new module.Product(pack_product);
                selectedOrder.addProduct(m_pack_product);

                var cur_oline = selectedOrder.getSelectedLine();
                cur_oline.product.set('is_pack', is_pack_previous);

                pack_product.is_pack = is_pack_previous;
                pack_product.name = pack_name;
            }

            for(var i = 1; i <= nb_items; i++){
                var field = $('#v_' + i);
                var product_id = parseInt(field.val());
                var product = self.pos.db.get_product_by_id(product_id);

                //add products to the order
                if(product){
                    // change name (suffix)  + price = 0.00
                    var previous_name = product.name;
                    var previous_price = product.price;

                    product.name = '⁪├ ' + product.name;
                    product.price = '0.00';

                    var m_product = new module.Product(product);
                    selectedOrder.addProduct(m_product);

                    // change name + price back
                    product.name = previous_name;
                    product.price = previous_price;
                }
            };

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
            if (!line || line.product.name[1] == '├' || line.is_pack){
                //TODO don't allow return product
            }
            return OrderSuper.prototype.addProduct.call(this, line)
        }

    })

    var OrderlineSuper = module.Orderline;
    module.Orderline = module.Orderline.extend({
        set_quantity: function(quantity){
            var self = this;
            var product_name = this.get_product().name;

            if(quantity === 'remove'){

                // when we remove a pack
                // we have too remove items too !
                if(product_name[0] == '■'){

                    var o_lines = [];
                    var cur_order = this.pos.get('selectedOrder');
                    var sel_line = cur_order.selected_orderline;

                    (cur_order.get('orderLines')).each(_.bind( function(item) {
                        return o_lines.push(item);
                    }, this));

                    var flag_cur = false;

                    for(var i = 0,  len = o_lines.length; i < len; i++){

                        // when we found current line
                        if(o_lines[i] == sel_line){
                            flag_cur = true;
                        }

                        // we delete items of the pack
                        if(flag_cur == true){
                            var cur_product_name = o_lines[i].product.name;

                            if(cur_product_name[1] == '├'){
                                this.order.removeOrderline(o_lines[i]);
                            }else{
                                // until we found that this is not an item of the selected pack
                                if(cur_product_name[0] != '■'){
                                    flag_cur = false;
                                }
                            }
                        }
                    }

                }
                return OrderlineSuper.prototype.set_quantity.call(this, quantity);
            }else{

                if(product_name[0] != '■'){
                    // packages must be sold one by one
                    OrderlineSuper.prototype.set_quantity.call(this, quantity);
                    return;
                }
            }
            this.trigger('change');
        },

        // when we add an new orderline we want to merge it with the last line to see reduce the number of items
        // in the orderline. This returns true if it makes sense to merge the two
        can_be_merged_with: function(orderline){
            var product_name = this.get_product().name;

            // do not merge if this is an item of the pack nor if this is a return (for visual)
            if(product_name[1] == '├' || this.is_return == true){
                return false;
            }
            return OrderlineSuper.prototype.can_be_merged_with.call(this, orderline);
        },


    })

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
    })

    module.PosWidget.include({
        template: 'PosWidget',
        build_widgets: function() {
            var self = this;
            this._super();
            this.pack = new module.PackScreenWidget(this, {});
            this.pack.prependTo($('.rightpane>.window'));


        }
    })
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

        pos_product_available(instance, module);

        $('<link rel="stylesheet" href="/tg_pos_packs/static/src/css/pos.css"/>').appendTo($("head"))
    }
})()