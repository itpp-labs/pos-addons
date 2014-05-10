
function tg_pos_enhanced_models(instance, module){ //module is instance.point_of_sale
    var module = instance.point_of_sale;

    String.prototype.setCharAt = function(index,chr) {
        if(index > this.length-1) return str;
        return this.substr(0,index) + chr + this.substr(index+1);
    }

    module.PosModel = Backbone.Model.extend({
        initialize: function(session, attributes) {
            Backbone.Model.prototype.initialize.call(this, attributes);
            var  self = this;
            this.session = session;                 
            this.ready = $.Deferred();                          // used to notify the GUI that the PosModel has loaded all resources
            this.flush_mutex = new $.Mutex();                   // used to make sure the orders are sent to the server once at time

            this.barcode_reader = new module.BarcodeReader({'pos': this});  // used to read barcodes
            this.proxy = new module.ProxyDevice();              // used to communicate to the hardware devices via a local proxy
            this.db = new module.PosLS();                       // a database used to store the products and categories
            this.db.clear('products','categories');
            this.debug = jQuery.deparam(jQuery.param.querystring()).debug !== undefined;    //debug mode 

            // default attributes values. If null, it will be loaded below.
            this.set({
                'nbr_pending_operations': 0,    

                'currency':         {symbol: '$', position: 'after'},
                'shop':             null, 
                'company':          null,
                'user':             null,   // the user that loaded the pos
                'pwd':              null,   // pwd manager
                'user_list':        null,   // list of all users
                'partner_list':     null,   // list of all partners with an ean
                'cashier':          null,   // the logged cashier, if different from user

                'orders':           new module.OrderCollection(),
                //this is the product list as seen by the product list widgets, it will change based on the category filters
                'products':         new module.ProductCollection(), 
                'cashRegisters':    null, 

                'bank_statements':  null,
                'taxes':            null,
                'pos_session':      null,
                'pos_config':       null,
                'units':            null,
                'units_by_id':      null,
                'pricelist':        null,

                'selectedOrder':    null,
            });

            this.get('orders').bind('remove', function(){ self.on_removed_order(); });
            
            // We fetch the backend data on the server asynchronously. this is done only when the pos user interface is launched,
            // Any change on this data made on the server is thus not reflected on the point of sale until it is relaunched. 
            // when all the data has loaded, we compute some stuff, and declare the Pos ready to be used. 
            $.when(this.load_server_data())
                .done(function(){
                    //self.log_loaded_data(); //Uncomment if you want to log the data to the console for easier debugging
                    self.ready.resolve();
                }).fail(function(){
                    //we failed to load some backend data, or the backend was badly configured.
                    //the error messages will be displayed in PosWidget
                    self.ready.reject();
                });
        },

        // helper function to load data from the server
        fetch: function(model, fields, domain, ctx){
            return new instance.web.Model(model).query(fields).filter(domain).context(ctx).all()
        },
        // loads all the needed data on the sever. returns a deferred indicating when all the data has loaded. 
        load_server_data: function(){
            var self = this;

            var loaded = self.fetch('res.users',['name','company_id', 'pos_manager_pwd'],[['id','=',this.session.uid]]) 
                .then(function(users){
                    self.set('user',users[0]);
                    self.set('pwd',users[0].pos_manager_pwd);

                    return self.fetch('res.company',
                    [
                        'currency_id',
                        'email',
                        'website',
                        'company_registry',
                        'vat',
                        'name',
                        'phone',
                        'partner_id',
                    ],
                    [['id','=',users[0].company_id[0]]]);
                }).then(function(companies){
                    self.set('company',companies[0]);

                    return self.fetch('res.partner',['contact_address'],[['id','=',companies[0].partner_id[0]]]);
                }).then(function(company_partners){
                    self.get('company').contact_address = company_partners[0].contact_address;

                    return self.fetch('product.uom', null, null);
                }).then(function(units){
                    self.set('units',units);
                    var units_by_id = {};
                    for(var i = 0, len = units.length; i < len; i++){
                        units_by_id[units[i].id] = units[i];
                    }
                    self.set('units_by_id',units_by_id);
                    
                    return self.fetch('product.packaging', null, null);
                }).then(function(packagings){
                    self.set('product.packaging',packagings);
                    
                    return self.fetch('res.users', ['name','ean13'], [['ean13', '!=', false]]);
                }).then(function(users){
                    self.set('user_list',users);

                    return self.fetch('res.partner', ['name','ean13'], [['ean13', '!=', false]]);
                }).then(function(partners){
                    self.set('partner_list',partners);

                    return self.fetch('account.tax', ['amount', 'price_include', 'type']);
                }).then(function(taxes){
                    self.set('taxes', taxes);

                    return self.fetch(
                        'pos.session', 
                        ['id', 'journal_ids','name','user_id','config_id','start_at','stop_at'],
                        [['state', '=', 'opened'], ['user_id', '=', self.session.uid]]
                    );
                }).then(function(sessions){
                    self.set('pos_session', sessions[0]);

                    return self.fetch(
                        'pos.config',
                        ['name','journal_ids','shop_id','journal_id',
                         'iface_self_checkout', 'iface_led', 'iface_cashdrawer',
                         'iface_payment_terminal', 'iface_electronic_scale', 'iface_barscan', 'iface_vkeyboard',
                         'iface_print_via_proxy','iface_cashdrawer','state','sequence_id','session_ids'],
                        [['id','=', self.get('pos_session').config_id[0]]]
                    );
                }).then(function(configs){
                    var pos_config = configs[0];
                    self.set('pos_config', pos_config);
                    self.iface_electronic_scale    =  !!pos_config.iface_electronic_scale;  
                    self.iface_print_via_proxy     =  !!pos_config.iface_print_via_proxy;
                    self.iface_vkeyboard           =  !!pos_config.iface_vkeyboard; 
                    self.iface_self_checkout       =  !!pos_config.iface_self_checkout;
                    self.iface_cashdrawer          =  !!pos_config.iface_cashdrawer;

                    return self.fetch('sale.shop',[],[['id','=',pos_config.shop_id[0]]]);
                }).then(function(shops){
                    self.set('shop',shops[0]);

                    return self.fetch('product.pricelist',['currency_id'],[['id','=',self.get('shop').pricelist_id[0]]]);
                }).then(function(pricelists){
                    self.set('pricelist',pricelists[0]);

                    return self.fetch('res.currency',['symbol','position','rounding','accuracy'],[['id','=',self.get('pricelist').currency_id[0]]]);
                }).then(function(currencies){
                    self.set('currency',currencies[0]);

                    return self.fetch('product.packaging',['ean','product_id']);
                }).then(function(packagings){
                    self.db.add_packagings(packagings);

                    return self.fetch('pos.category', ['id','name','parent_id','child_id','image'])
                }).then(function(categories){
                    self.db.add_categories(categories);

                    return self.fetch(
                        'product.product', 
                        ['name', 'list_price','price','pos_categ_id', 'taxes_id', 'ean13', 'default_code',
                         'to_weight', 'uom_id', 'uos_id', 'uos_coeff', 'mes_type', 'description_sale', 'description', 'is_pack'],
                        [['sale_ok','=',true],['available_in_pos','=',true]],
                        {pricelist: self.get('shop').pricelist_id[0]} // context for price
                    );
                }).then(function(products){
                    self.db.add_products(products);

                    return self.fetch(
                        'account.bank.statement',
                        ['account_id','currency','journal_id','state','name','user_id','pos_session_id'],
                        [['state','=','open'],['pos_session_id', '=', self.get('pos_session').id]]
                    );
                }).then(function(bank_statements){
                    var journals = new Array();
                    _.each(bank_statements,function(statement) {
                        journals.push(statement.journal_id[0])
                    });
                    self.set('bank_statements', bank_statements);
                    return self.fetch('account.journal', undefined, [['id','in', journals]]);
                }).then(function(journals){
                    self.set('journals',journals);

                    // associate the bank statements with their journals. 
                    var bank_statements = self.get('bank_statements');
                    for(var i = 0, ilen = bank_statements.length; i < ilen; i++){
                        for(var j = 0, jlen = journals.length; j < jlen; j++){
                            if(bank_statements[i].journal_id[0] === journals[j].id){
                                bank_statements[i].journal = journals[j];
                                bank_statements[i].self_checkout_payment_method = journals[j].self_checkout_payment_method;
                            }
                        }
                    }
                    self.set({'cashRegisters' : new module.CashRegisterCollection(self.get('bank_statements'))});
                });
        
            return loaded;
        },

        // logs the usefull posmodel data to the console for debug purposes
        log_loaded_data: function(){
            console.log('PosModel data has been loaded:');
            console.log('PosModel: units:',this.get('units'));
            console.log('PosModel: bank_statements:',this.get('bank_statements'));
            console.log('PosModel: journals:',this.get('journals'));
            console.log('PosModel: taxes:',this.get('taxes'));
            console.log('PosModel: pos_session:',this.get('pos_session'));
            console.log('PosModel: pos_config:',this.get('pos_config'));
            console.log('PosModel: cashRegisters:',this.get('cashRegisters'));
            console.log('PosModel: shop:',this.get('shop'));
            console.log('PosModel: company:',this.get('company'));
            console.log('PosModel: currency:',this.get('currency'));
            console.log('PosModel: user_list:',this.get('user_list'));
            console.log('PosModel: user:',this.get('user'));
            console.log('PosModel.session:',this.session);
            console.log('PosModel end of data log.');
        },
        
        // this is called when an order is removed from the order collection. It ensures that there is always an existing
        // order and a valid selected order
        on_removed_order: function(removed_order){
            if( this.get('orders').isEmpty()){
                this.add_new_order();
            }else{
                this.set({ selectedOrder: this.get('orders').last() });
            }
        },

        // saves the order locally and try to send it to the backend. 'record' is a bizzarely defined JSON version of the Order
        push_order: function(record) {
            this.db.add_order(record);
            this.flush();
        },

        //creates a new empty order and sets it as the current order
        add_new_order: function(){
            var order = new module.Order({pos:this});
            this.get('orders').add(order);
            this.set('selectedOrder', order);
        },

        // attemps to send all pending orders ( stored in the pos_db ) to the server,
        // and remove the successfully sent ones from the db once
        // it has been confirmed that they have been sent correctly.
        flush: function() {
            //TODO make the mutex work 
            //this makes sure only one _int_flush is called at the same time
            /*
            return this.flush_mutex.exec(_.bind(function() {
                return this._flush(0);
            }, this));
            */
            this._flush(0);
        },
        // attempts to send an order of index 'index' in the list of order to send. The index
        // is used to skip orders that failed. do not call this method outside the mutex provided
        // by flush() 
        _flush: function(index){
            var self = this;
            var orders = this.db.get_orders();
            self.set('nbr_pending_operations',orders.length);

            var order  = orders[index];
            if(!order){
                return;
            }
            //try to push an order to the server
            // shadow : true is to prevent a spinner to appear in case of timeout
            (new instance.web.Model('pos.order')).call('create_from_ui',[[order]],undefined,{ shadow:true })
                .fail(function(unused, event){
                    //don't show error popup if it fails 
                    event.preventDefault();
                    console.error('Failed to send order:',order);
                    self._flush(index+1);
                })
                .done(function(){
                    //remove from db if success
                    self.db.remove_order(order.id);
                    self._flush(index);
                });
        },

        scan_product: function(parsed_ean){
            var self = this;
            var product = this.db.get_product_by_ean13(parsed_ean.base_ean);
            var selectedOrder = this.get('selectedOrder');

            if(!product){
                return false;
            }

            if(parsed_ean.type === 'price'){
                selectedOrder.addProduct(new module.Product(product), {price:parsed_ean.value});
            }else if(parsed_ean.type === 'weight'){
                selectedOrder.addProduct(new module.Product(product), {quantity:parsed_ean.value, merge:false});
            }else{
                selectedOrder.addProduct(new module.Product(product));
            }
            return true;
        },
    });
};

function tg_pos_enhanced(instance, module){ //module is instance.point_of_sale
    var module = instance.point_of_sale;
    var QWeb = instance.web.qweb;
    _t = instance.web._t;

    var round_di = instance.web.round_decimals;
    var round_pr = instance.web.round_precision;

    // // unselect customer
    var unselect_client = function(){

            $('#selected-customer-name').html('?');
            $('#btns-customer').html('');
            $('#montantCumule').html('');
            $('#selected-vip').html('');

            //images
            $('#img-sel_cus').attr('src', 'tg_pos_enhanced/static/src/img/disabled_client.png');
            $('#img_amountcumul').attr('src', 'tg_pos_enhanced/static/src/img/disabled_montant_cumule.png');

            //css
            $('#client-btns li').css('background', '#d3d3d3');
            $('#client-btns li').css('border','1px solid #cacaca');

            // form edit
            $('#input_name').val('');
            $('#input_firstname').val('');
            $('#input_zip').val('');
            $('#input_phone').val('');
            $('#input_mobile').val('');
            $('#input_email').val('');
            $('#input_comment').val('');
            $('#input_partner_id').val('0');
        };

    // hide customer window
    var close_cs_window = function(){
            $('#id-clientscreenwidget').css('display', 'none');
            $('#products-screen').css('display', 'block');
            $('#cache_left_pane').css('display', 'none');
        };
        
    // hide message
    var close_pos_messages = function(){
        $('#mid').val('0');
        $('#msg_title').html('');
        $('#msg_content').html('');
        self.$('#msg_frame').css('display', 'none');
    };
    
     // get POS messages
    var get_pos_messages = function(){
        var self = this;   
        msg_list = [];
        
        $('#msg_title').html('');
        $('#msg_content').html('');
        $('#mid').val('0');
        
        posid = parseInt(posid);

        if(posid != 0){     
            
            var Mget = new instance.web.Model('pos.message');

            Mget.call('get_available_message', [posid], undefined, { shadow:true })
            .fail(function(message){
                alert('POS messaging : get_available_message = failed');
            })
            .done(function(message){

                if(message != null && message.m_id != null){
                    self.$('#msg_frame').css('display', 'block');
                    $('#mid').val(message.m_id);
                    $('#msg_title').html(message.m_title);
                    $('#msg_content').html(message.m_content);

                    
                    var url_img = '';
                    
                    switch(message.m_type){
                        case 1 : url_img = 'tg_pos_message/static/src/img/m_information.png';
                            break;
                        case 2 : url_img = 'tg_pos_message/static/src/img/m_question.png';
                            break;
                        case 3 : url_img = 'tg_pos_message/static/src/img/m_alert.png';
                            break;
                        case 4 : url_img = 'tg_pos_message/static/src/img/m_warning.png';
                            break;
                        case 5 : url_img = 'tg_pos_message/static/src/img/m_other.png';
                            break;
                        default : url_img = 'tg_pos_message/static/src/img/m_information.png';
                            break;
                    }
                    
                    $('#msg_header').css('background-image', 'url(' + url_img + ')');
                    
                }
            });

        }else{
            close_pos_messages();
        }
    };
    
    // show customer form
    var show_form_client = function(){
            $('.order-container').css('display', 'none');
            $('#leftpane footer').css('display', 'none');
            $('#form-client').css('display', 'block');
            $('#cache-header-cust').css('display', 'block');
            $('#cache-right-pan').css('display', 'block');
        };

    // get data from DB
    var fetch = function(model, fields, domain, ctx){
            return new instance.web.Model(model).query(fields).filter(domain).context(ctx).all();
        };

    //cashier listbox changes
    var cashier_change = function(name){
            globalCashier = name;

            $('#pay-screen-cashier-name').html(name);
            
            if(name != '' && name != 'nobody'){
                $('.gotopay-button').removeAttr('disabled');    
                $('#msg_cashier').css('display', 'none');            
            } else{
                $('.gotopay-button').attr('disabled', 'disabled');
                $('#msg_cashier').css('display', 'inline-block'); 
            }
        };

    // Shorten names too long (for display)
    var ellipseName = function(name){
        var l = name.length;
        if (l > 30){
            return name.substring(0, 27) + '...';
        }

        return name;
    };

    global_letter = 'A';
    globalCashier = null;
    nbCashiers = 0;
    can_show_histo = true;
    global_pwd = null;
    posid = 0;

    module.ClientsLettersWidget = module.ScreenWidget.extend({
        template: 'ClientsLettersWidget',

        init: function(parent, options) {
            this._super(parent);
            var  self = this; 
            this.client_letter_widget = this;
        },

        start: function(){
            var self = this;
            self.build_letters();
        },

        // get customers
        get_clients: function(letter){
            var self = this;
            var clients_list = [];
            var l_filter = [['customer', '=', true], 
                           ['name','=ilike', letter + '%']];

            if(letter == '0-9'){
                l_filter = [['customer', '=', true],
                            '|', '|', '|', '|', '|', '|', '|', '|', '|',
                            ['name','=ilike', '0%'],
                            ['name','=ilike', '1%'],
                            ['name','=ilike', '2%'],
                            ['name','=ilike', '3%'],
                            ['name','=ilike', '4%'],
                            ['name','=ilike', '5%'],
                            ['name','=ilike', '6%'],
                            ['name','=ilike', '7%'],
                            ['name','=ilike', '8%'],
                            ['name','=ilike', '9%']
                            ];
            }

            var loaded = fetch(
                                'res.partner',
                                ['id', 
                                 'name', 
                                 'firstname', 
                                 'zip', 
                                 'phone', 
                                 'mobile', 
                                 'email', 
                                 'montantCumule',  
                                 'pos_comment'],
                                l_filter
                                )

                .then(function(clients){
                     for(var i = 0, len = clients.length; i < len; i++){
                        clients_list[i] = [];
                        clients_list[i]['id'] = clients[i].id;
                        clients_list[i]['montantCumule'] = clients[i].montantCumule;
                        clients_list[i]['name'] = clients[i].name;
                        clients_list[i]['firstname'] = (clients[i].firstname == false)? '' : clients[i].firstname;
                        clients_list[i]['zip'] = clients[i].zip;
                        clients_list[i]['phone'] = clients[i].phone;
                        clients_list[i]['mobile'] = clients[i].mobile;
                        clients_list[i]['email'] = clients[i].email; 
                        clients_list[i]['comment'] = clients[i].pos_comment;                     
                     };

                    // remove customers lines
                    $('#client-list tr').remove();

                    if(clients_list.length > 0){          
                        for(var i = 0, len = clients_list.length; i < len; i++){
                           var one_client = QWeb.render('ClientWidget',{
                                                        c_id:clients_list[i].id,
                                                        c_name:clients_list[i].name, 
                                                        c_firstname:clients_list[i].firstname,
                                                        c_zip:clients_list[i].zip,
                                                        c_phone:clients_list[i].phone,
                                                        c_mobile:clients_list[i].mobile,
                                                        c_email:clients_list[i].email,
                                                        c_comment:clients_list[i].comment,
                                                        c_montantCumule:clients_list[i].montantCumule,
                                                    });

                           $(one_client).appendTo($('#client-list')).click(function(){
                                var s_id = $('.c-id', this).html().trim();
                                var s_name = $('.c-name', this).html().trim();
                                var s_fname = $('.c-firstname', this).html().trim();
                                var s_zip = $('.c-zip', this).html().trim();
                                var s_phone = $('.c-phone', this).html().trim();
                                var s_mobile = $('.c-mobile', this).html().trim();
                                var s_email = $('.c-email', this).html().trim();
                                var s_comment = $('.c-comment', this).html().trim();
                                var s_montant_cumule = $('.c-montant-cumule', this).html().trim();
                                
                                self.select_client(s_id, s_name, s_fname, s_montant_cumule);
                           });
                        }

                    } else{
                        var no_client = QWeb.render('NoClientWidget',{});
                        $(no_client).appendTo($('#client-list'));
                    }

                    $('#nb_customers').html(clients_list.length);
                });
        },


        // select one customer
        select_client: function(cid, cname, cfname, cmontantcumule){
            var self = this;   

                unselect_client();

                var sel_client = cname + ' ' + cfname;
                var mc = Number(cmontantcumule).toFixed(2);

                $('#selected-customer-name').html(ellipseName(sel_client));
                $('#montantCumule').html(mc);
                
                if(cmontantcumule >= 500){
                    $('#selected-vip').html('<img src="tg_pos_enhanced/static/src/img/vip.png"/>');
                }else{
                    $('#selected-vip').html('');
                }

                var close_button = QWeb.render('ClientRemoveWidget',{});
                $(close_button).appendTo($('#btns-customer')).click(function(){
                    self.pos.get('selectedOrder').set_partner_id(0);
                    unselect_client();
                });

                var edit_button = QWeb.render('ClientEditWidget',{});
                $(edit_button).appendTo($('#btns-customer')).click(function(){
                    self.edit_client();
                });

                if(Number(cmontantcumule) > 0){
                    var sales_button = QWeb.render('ClientSalesWidget',{});      
                    $(sales_button).appendTo($('#btns-customer')).click(function(){
                        self.see_customer_sales();
                    });
                    $('#cust_sales_btn').attr('src', 'tg_pos_enhanced/static/src/img/see_sales.png'); 
                    $('#cust_sales_btn').css('cursor', 'pointer');
                }else{
                    var sales_button = QWeb.render('ClientSalesWidget',{});                         
                    $(sales_button).appendTo($('#btns-customer'));
                    $('#cust_sales_btn').attr('src', 'tg_pos_enhanced/static/src/img/disabled_see_sales.png'); 
                    $('#cust_sales_btn').css('cursor', 'default');
                }

                //images
                $('#img-sel_cus').attr('src', 'tg_pos_enhanced/static/src/img/client.png');
                $('#img_amountcumul').attr('src', 'tg_pos_enhanced/static/src/img/montant_cumule.png');

                // css
                $('#client-btns li').css('background', '#fff');
                $('#client-btns li').css('border','1px solid gray');

                //form
                $('#input_partner_id').val(cid);
                self.pos.get('selectedOrder').set_partner_id(cid);

            close_cs_window();
        },

        // see clients's sales
        see_customer_sales: function(){
            $('#cache_left_pane').css('display', 'block');
            $('#cache-header-cust').css('display', 'block');
            $('#id-clientscreenwidget').css('display', 'none');
            $('#products-screen').css('display', 'none');
            $('#id_salesscreen').css('display', 'block');
        },

        // edit customer
        edit_client: function(){
            var self = this;

            var cid = $('#input_partner_id').val();

            var loaded = fetch(
                                'res.partner',
                                ['name', 
                                 'firstname', 
                                 'zip', 
                                 'phone', 
                                 'mobile', 
                                 'email', 
                                 'pos_comment',
                                 'montantCumule'],
                                [['id' , '=', parseInt(cid)]]
                                )
                .then(function(client){
                     var the_client = client[0];
                        
                        // form edit
                        $('#input_name').val(the_client.name);
                        $('#input_firstname').val(the_client.firstname || '');
                        $('#input_zip').val(the_client.zip || '');
                        $('#input_phone').val(the_client.phone || '');
                        $('#input_mobile').val(the_client.mobile || '');
                        $('#input_email').val(the_client.email || '');
                        $('#input_comment').val(the_client.pos_comment || '');
                        $('#input_partner_id').val(cid);
                });

            // error messages
            $('#error_cname').css('display', 'none');
            $('#error_cfirstname').css('display', 'none');
            $('#error_czip').css('display', 'none');
            $('#error_cphone').css('display', 'none');
            $('#error_cmobile').css('display', 'none');
            $('#error_cemail').css('display', 'none');
            $('#error-msg').css('display', 'none');

            $('#titre_form_edit_client').css('display', 'block');
            $('#titre_form_create_client').css('display', 'none');

            show_form_client();
        },
      
        // letters for the search
        build_letters: function(){
            var self = this;
            var letters = ['0-9','A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 
                           'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

            for(var i = 0, len = letters.length; i < len; i++){
                var aLetter = letters[i];
                var button = QWeb.render('OneLetterWidget',{letter:aLetter});

                $(button).appendTo($('.letters')).click(function(){
                    
                    $('.letters').children('li').each(function(index){
                        index + ": " + $(this).removeClass().addClass('one-letter');
                    });
                    $(this).removeClass().addClass('sel-letter');

                    global_letter = $(this).text().trim()
                    self.get_clients(global_letter);
                });
            }
        },          
    });

    module.tgPayScreenWidget = module.PaymentScreenWidget.include({
        template: 'PaymentScreenWidget', 

        show: function(){
            this._super();
            var self = this;

            $('#pay-screen-cashier-name').html(globalCashier);
            $('#ticket-screen-cashier-name').html(globalCashier);
            this.pos.get('selectedOrder').set_cashier_name(globalCashier);

            this.paypad = new module.PaypadWidget(this, {});
            this.paypad.replace($('#placeholder-PaypadWidget'));

            // remove previous buttons
            $('.pos-actionbar-button-list .button').remove();

            this.back_button = this.add_action_button({
                label: 'Back',
                icon: '/point_of_sale/static/src/img/icons/png48/go-previous.png',
                click: function(){  
                    self.pos_widget.screen_selector.set_current_screen(self.back_screen);
                    $('#cache-header-cust').css('display', 'none');

                    $('#numpad-return').removeAttr('disabled');
                    $('#return_img').attr('src', 'tg_pos_enhanced/static/src/img/return_product.png');
                },
            });

            this.validate_button = this.add_action_button({
                label: 'Validate',
                name: 'validation',
                icon: '/point_of_sale/static/src/img/icons/png48/validate.png',
                click: function(){
                    $('#cache_left_pane').css('display', 'block');

                    // remove customers lines
                    $('#client-list tr').remove();

                    // unselect letter
                    $('.letters').children('li').each(function(index){
                        index + ": " + $(this).removeClass().addClass('one-letter');
                    });

                    global_letter = 'A';
                    self.validateCurrentOrder(); 
                },
            });

            this.updatePaymentSummary();
            this.line_refocus();
        },

        deleteLine: function(lineWidget) {
            this._super(lineWidget);
            var self = this;
            self.show();
        },

        call_manager_special_discount: function(){
            $('#pwd_frame').css('display', 'block');
            $('#error_pwd').css('display', 'none');
            $('#error_obj').css('display', 'none');
            $('#discount_mngr').val('0.00');
            $('#discount_obj_mngr').val('');
            $('#pwd_mngr').val('');
        },

        renderElement: function() {
            var self = this;
            this._super();
            
            this.$('#btn-delremspec').click(function() {
                $('#enter_special_discount').val('0.00');
                self.pos.get('selectedOrder').set_special_discount_object('');
                $(this).hide();
                $('#btn-call-manager').show();
                self.updatePaymentSummary();
            });
            
            this.$('#btn-delremspec').hide();
            this.$('#btn-call-manager').show();

            this.$('#btn-call-manager').click(function() {
                self.call_manager_special_discount();
            });

            this.updatePaymentSummary();

            this.scrollbar = new module.ScrollbarWidget(this,{
                target_widget:   this,
                target_selector: '.pay-scroller',
                on_show: function(){
                    self.$('.pay-scroller').css({'padding-right':'0px'},100);
                },
                on_hide: function(){
                    self.$('.pay-scroller').css({'padding-right':'0px'},100);
                },
            });

            this.scrollbar.replace(this.$('.placeholder-ScrollbarWidget'));

        },

        updatePaymentSummary: function() {
            var self = this;
            this._super();

            var currentOrder = this.pos.get('selectedOrder');
            var specialDiscount = $('#enter_special_discount').val();
            var paidTotal = currentOrder.getPaidTotal();
        
            // on déclare la somme due
            var totalDeDepart = currentOrder.getTotalTaxIncluded();

            // total des remises
            var totalRemises = 0;
            totalRemises = parseFloat(specialDiscount);

            // C'est l'histoire de Totaux...
            var sousTotalApayer = parseFloat(totalDeDepart) - parseFloat(totalRemises); // 59 - 9.10 = 49.9 - 10% = 44.91
            var resteApayer = parseFloat(sousTotalApayer) - parseFloat(paidTotal); // 4.30 - paidTotal
            var remaining = sousTotalApayer > paidTotal ? parseFloat(sousTotalApayer) - parseFloat(paidTotal) : 0;     
            var monnaieArendre = paidTotal > sousTotalApayer ? parseFloat(paidTotal) - parseFloat(sousTotalApayer) : 0;

            var rounding = this.pos.get('currency').rounding;
            var round_pr = instance.web.round_precision
            remaining = round_pr(remaining, rounding);

            this.$('#payment-due-total').html(this.format_currency(totalDeDepart));
            this.$('#soustotalapresremises').html(this.format_currency(sousTotalApayer));
            this.$('#payment-paid-total').html(this.format_currency(paidTotal));
            this.$('#payment-remaining').html(this.format_currency(remaining));
            this.$('#payment-change').html(this.format_currency(monnaieArendre));

            if(currentOrder.selected_orderline === undefined){
                remaining = 1;  // What is this ? 
            }
                
            if(this.pos_widget.action_bar){
                this.pos_widget.action_bar.set_button_disabled('validation', (sousTotalApayer < 0 || remaining > 0));
            }
        },

    }); 

    module.tgReceiptScreenWidget = module.ReceiptScreenWidget.include({

        refresh: function() {
            this._super();
            $('.pos-receipt-container', this.$el).html(QWeb.render('PosTicket',{widget:this}));

            if(globalCashier != ''){
                this.$('#ticket-screen-cashier-name').html(globalCashier);           
            }         
        },

        getTicketComment: function(){
            return $('#input_comment').val();
        },

        getTicketMontantCumule: function(){
            var self = this;
            var cur_order = self.pos.get('selectedOrder');
            var cur_partner_id = cur_order.get_partner_id();

                if(cur_partner_id == null){
                    return false;
                }

                if($('#montantCumule').html() == ''){
                    return false;
                }

                var old_cumul = parseFloat($('#montantCumule').html());
                var cur_amount = cur_order.getTotalTaxIncluded() - cur_order.getDiscountAfter();
                var new_cumul = parseFloat(old_cumul + cur_amount);

                return new_cumul.toFixed(2);
        },

        show: function(){
            this._super();
            var self = this;

            // remove previous buttons
            $('.pos-actionbar-button-list .button').remove();

            this.add_action_button({
                    label: _t('Print'),
                    icon: '/point_of_sale/static/src/img/icons/png48/printer.png',
                    click: function(){  
                        self.print();              
                    },
                });

            this.add_action_button({
                    label: _t('Next Order'),
                    icon: '/point_of_sale/static/src/img/icons/png48/go-next.png',
                    click: function() { 
                        self.finishOrder(); 
                        $('#cache_left_pane').css('display', 'none');
                        $('#cache-header-cust').css('display', 'none');  

                        $('#numpad-return').attr('disabled', 'disabled');
                        $('#return_img').attr('src', 'tg_pos_enhanced/static/src/img/disabled_return_product.png');

                        if(nbCashiers > 1){
                            $('#cashier-select').val('nobody');
                            globalCashier = 'nobody';
                            cashier_change(globalCashier);
                        }

                        unselect_client();
                        
                        // check for new messages
                        get_pos_messages();
                    },
                });
        },

        print: function() {
            window.print();
        },

        renderElement: function(){
            var self = this;
            this._super();
            this.scrollbar = new module.ScrollbarWidget(this,{
                target_widget:   this,
                target_selector: '.ticket-scroller',
                on_show: function(){
                    self.$('.ticket-scroller').css({'padding-right':'0px'},100);
                },
                on_hide: function(){
                    self.$('.ticket-scroller').css({'padding-right':'0px'},100);
                },
            });

            this.scrollbar.replace(this.$('.placeholder-ScrollbarWidget'));
        },
    });

    module.GoToPayWidget = module.PosBaseWidget.extend({
        template: 'GoToPayWidget',
        
        init: function(parent, options) {
            this._super(parent);
        },

        renderElement: function() {
            var self = this;
            this._super();

            var button = new module.GoToPayButtonWidget(self);
            button.prependTo(self.$el);
        },
    });

    module.GoToPayButtonWidget = module.PosBaseWidget.extend({
        template: 'GoToPayButtonWidget',
        
        init: function(parent, options) {
            this._super(parent);
        },

        renderElement: function() {
            var self = this;
            this._super();

            this.$el.click(function(){
                self.pos_widget.screen_selector.set_current_screen('payment');
                $('#cache-header-cust').css('display', 'block');
                $('#numpad-return').attr('disabled', 'disabled');
                $('#return_img').attr('src', 'tg_pos_enhanced/static/src/img/disabled_return_product.png');
            });
        },
    });

    module.PackWidget = module.ScreenWidget.extend({
        template: 'PackWidget',

        init: function(parent, options) {
            this._super(parent);
            var  self = this; 
        },

    });

    module.AlertPwdWidget = module.ScreenWidget.extend({
        template:'AlertPwdWidget',

        init: function(parent, options) {
            this._super(parent);
            var  self = this; 
        },

        renderElement: function(){
            var self = this;
            this._super();

            this.$('#input_pwd_cancel').click(function() {
                $('#pwd_frame').css('display', 'none');
            });

            this.$('#input_pwd_send').click(function() {
                self.check_pwd_manager();
            });

            this.$('#discount_mngr').keyup(function(){
                if($.isNumeric($(this).val()) == false){
                    $('#discount_mngr').val('0.00');
                }
            });
        },

        check_pwd_manager: function(){
            var self = this;

            var pwd_entered = $('#pwd_mngr').val();
            var obj_entered = $('#discount_obj_mngr').val();

            $('#error_obj').css('display', 'none');
            $('#error_pwd').css('display', 'none');

            if(pwd_entered != global_pwd){
                $('#pwd_mngr').val('');
                $('#error_pwd').css('display', 'inline-block');
            }else if(obj_entered == ''){
                $('#error_obj').css('display', 'inline-block');
            }else{
                $('#enter_special_discount').val(parseFloat($('#discount_mngr').val()).toFixed(2));
                self.pos.get('selectedOrder').set_special_discount_object($('#discount_obj_mngr').val());
                $('#btn-delremspec').show();
                $('#btn-call-manager').hide();
                $('#pwd_frame').css('display', 'none');

                $(window)[0].screen_selector.current_screen.updatePaymentSummary();
            }
        },
    });

    module.tgNumpad = module.NumpadWidget.include({
        template:'NumpadWidget',

        init: function(parent, options) {
            this._super(parent);
            var  self = this; 
        },

        start: function() {
            var self = this;
            this._super();

            $('#numpad-return').click(function(){
                self.return_product();
            });
        },

        return_product: function(){
            var cur_pos = this.pos;
            var cur_order = cur_pos.get('selectedOrder');
            var cur_oline = cur_order.getSelectedLine();

           if(cur_oline.product.get('is_pack') == false){

                cur_oline.is_return = true;
                cur_oline.price = - Math.abs(cur_oline.price);

                var oline_price = null;
                var oline = null;

                $oline = $('.orderline.selected');
                $oline_price = $oline.find('.price');

                var cur_display_price = $oline_price.html().trim();

                if(cur_display_price[0] != '-'){
                    $oline_price.html('-' + cur_display_price);
                }
            }
        },
    });


    module.Order = Backbone.Model.extend({
        initialize: function(attributes){
            Backbone.Model.prototype.initialize.apply(this, arguments);
            this.set({
                creationDate:   new Date(),
                orderLines:     new module.OrderlineCollection(),
                paymentLines:   new module.PaymentlineCollection(),
                name:           "Order " + this.generateUniqueId(),
                client:         null,
                partner_id:     null,
                partner_name:   null,
                cashier_name:   null,
                special_discount: null,
                special_disobj: null,
            });
            this.pos =     attributes.pos; 
            this.selected_orderline = undefined;
            this.screen_data = {};  // see ScreenSelector
            this.receipt_type = 'receipt';  // 'receipt' || 'invoice'
            return this;
        },

        set_cashier_name: function(name){
            this.set('cashier_name', name);
        },

        generateUniqueId: function() {
            return new Date().getTime();
        },
        addProduct: function(product, options){

            options = options || {};
            var attr = product.toJSON();

            // if is_pack = false, this is a real product
            // we send it to the order
            if(attr.is_pack == false){
                attr.pos = this.pos;
                attr.order = this;
                var line = new module.Orderline({}, {pos: this.pos, order: this, product: product});

                if(options.quantity !== undefined){
                    line.set_quantity(options.quantity);
                }
                if(options.price !== undefined){
                    line.set_unit_price(options.price);
                }

                var last_orderline = this.getLastOrderline();
                if( last_orderline && last_orderline.can_be_merged_with(line) && options.merge !== false){
                    last_orderline.merge(line);
                }else{
                    this.get('orderLines').add(line);
                }
                this.selectLine(this.getLastOrderline());
            }else{

                // this is a Pack !!
                this.show_screen_pack(attr.name);

                // get templates 
                this.get_templates(attr.id);

            }
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

        get_variant: function(product_tmpl_id, sel_variant_id){
            var self = this;
            var product_list = [];

            var loaded = fetch('product.product', ['name', 'id'],
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
                        var new_option = '<option value=\'' + products[i].id + '\'>' + products[i].name + '</option>\n';
                        $('#' + sel_variant_id).html(content + new_option);
                    }
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
            $('#products-screen').css('display', 'none');
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
            $('#products-screen').css('display', 'block');
            $('#pack_screen').css('display', 'none');
        },

        removeOrderline: function( line ){
            this.get('orderLines').remove(line);
            this.selectLine(this.getLastOrderline());
        },
        getLastOrderline: function(){
            return this.get('orderLines').at(this.get('orderLines').length -1);
        },
        addPaymentLine: function(cashRegister) {
            var paymentLines = this.get('paymentLines');
            var newPaymentline = new module.Paymentline({},{cashRegister:cashRegister});

            if(cashRegister.get('journal').type !== 'cash'){
                newPaymentline.set_amount( this.getDueLeft() );
            }
            paymentLines.add(newPaymentline);
        },
        getName: function() {
            return this.get('name');
        },
        getSubtotal : function(){
            return (this.get('orderLines')).reduce((function(sum, orderLine){
                return sum + orderLine.get_display_price();
            }), 0);
        },
        getTotalTaxIncluded: function() {
            return (this.get('orderLines')).reduce((function(sum, orderLine) {
                return sum + orderLine.get_price_with_tax();
            }), 0);
        },
        getDiscountBefore: function() {
            return (this.get('orderLines')).reduce((function(sum, orderLine) {
                return sum + (orderLine.get_unit_price() * (orderLine.get_discount()/100) * orderLine.get_quantity());
            }), 0);
        },
        getDiscountAfter: function() {
            return parseFloat($('#enter_special_discount').val());
        },
        getDiscountTotal: function() {
            return this.getDiscountBefore() + this.getDiscountAfter() ;
        },
        getTotalTaxExcluded: function() {
            return (this.get('orderLines')).reduce((function(sum, orderLine) {
                return sum + orderLine.get_price_without_tax();
            }), 0);
        },
        getTax: function() {
            return (this.get('orderLines')).reduce((function(sum, orderLine) {
                return sum + orderLine.get_tax();
            }), 0);
        },
        getPaidTotal: function() {
            return (this.get('paymentLines')).reduce((function(sum, paymentLine) {
                return sum + paymentLine.get_amount();
            }), 0);
        },
        getChange: function() {
            return this.getPaidTotal() + this.getDiscountAfter() - this.getTotalTaxIncluded();
        },
        getDueLeft: function() {
            return parseFloat($('#payment-remaining').html());
        },
        // sets the type of receipt 'receipt'(default) or 'invoice'
        set_receipt_type: function(type){
            this.receipt_type = type;
        },
        get_receipt_type: function(){
            return this.receipt_type;
        },
        // the client related to the current order.
        set_client: function(client){
            this.set('client',client);
        },
        set_partner_id: function(partner_id){
            this.set('partner_id', partner_id);
        },
        set_special_discount_object: function(dobj){
            this.set('special_disobj', dobj);
        },
        get_partner_id: function(){
            return this.get('partner_id');
        },
        get_client: function(){
            return this.get('client');
        },
        get_client_name: function(){
            var client = this.get('client');
            return client ? client.name : "";
        },
        // the order also stores the screen status, as the PoS supports
        // different active screens per order. This method is used to
        // store the screen status.
        set_screen_data: function(key,value){
            if(arguments.length === 2){
                this.screen_data[key] = value;
            }else if(arguments.length === 1){
                for(key in arguments[0]){
                    this.screen_data[key] = arguments[0][key];
                }
            }
        },
        //see set_screen_data
        get_screen_data: function(key){
            return this.screen_data[key];
        },

        get_special_discount: function(){
            return parseFloat($('#enter_special_discount').val());
        },

        get_partner_id: function(){
            return $('#input_partner_id').val();
        },

        // exports a JSON for receipt printing
        export_for_printing: function(){
            var orderlines = [];
            this.get('orderLines').each(function(orderline){
                orderlines.push(orderline.export_for_printing());
            });

            var paymentlines = [];
            this.get('paymentLines').each(function(paymentline){
                paymentlines.push(paymentline.export_for_printing());
            });
            var client  = this.get('client');
            var cashier = this.pos.get('cashier') || this.pos.get('user');
            var company = this.pos.get('company');
            var shop    = this.pos.get('shop');
            var date = new Date();

            return {
                orderlines: orderlines,
                paymentlines: paymentlines,
                subtotal: this.getSubtotal(),
                total_with_tax: this.getTotalTaxIncluded(),
                total_without_tax: this.getTotalTaxExcluded(),
                total_tax: this.getTax(),
                total_paid: this.getPaidTotal(),
                total_discount: this.getDiscountAfter(),
                change: this.getChange(),
                name : this.getName(),
                client: this.get_partner_id(),
                partner_id: this.get_partner_id(),
                invoice_id: null,   //TODO
                cashier: cashier ? cashier.name : null,
                date: { 
                    year: date.getFullYear(), 
                    month: date.getMonth(), 
                    date: date.getDate(),       // day of the month 
                    day: date.getDay(),         // day of the week 
                    hour: date.getHours(), 
                    minute: date.getMinutes() 
                }, 
                company:{
                    email: company.email,
                    website: company.website,
                    company_registry: company.company_registry,
                    contact_address: company.contact_address, 
                    vat: company.vat,
                    name: company.name,
                    phone: company.phone,
                },
                shop:{
                    name: shop.name,
                },
                currency: this.pos.get('currency'),
            };
        },
        exportAsJSON: function() {
            var orderLines, paymentLines;
            orderLines = [];
            (this.get('orderLines')).each(_.bind( function(item) {
                return orderLines.push([0, 0, item.export_as_JSON()]);
            }, this));

            paymentLines = [];
            (this.get('paymentLines')).each(_.bind( function(item) {
                return paymentLines.push([0, 0, item.export_as_JSON()]);
            }, this));

            var rounding = this.pos.get('currency').rounding;

            return {
                name: this.getName(),
                amount_paid: this.getPaidTotal(),
                amount_total: this.getTotalTaxIncluded(),
                amount_tax: this.getTax(),
                amount_return: round_pr(this.getChange(), rounding),
                lines: orderLines,
                statement_ids: paymentLines,
                discount: this.getDiscountAfter(),
                pos_session_id: this.pos.get('pos_session').id,
                partner_id: this.get('partner_id'),
                user_id: this.pos.get('cashier') ? this.pos.get('cashier').id : this.pos.get('user').id,
                cashier_name: this.pos.get('selectedOrder').get('cashier_name'),
                special_discount: this.get_special_discount(),
                special_disobj: this.pos.get('selectedOrder').get('special_disobj'),
            };
        },

        getSelectedLine: function(){
            return this.selected_orderline;
        },

        selectLine: function(line){
            if(line){
                var product_name = line.product.attributes.name;
                var is_pack = line.product.attributes.is_pack;

                if(product_name[1] != '├'){
                   // this.selected_orderline.set_selected(undefined);

                    if(line !== this.selected_orderline){
                        if(this.selected_orderline){
                            this.selected_orderline.set_selected(false);
                        }
                        this.selected_orderline = line;
                        this.selected_orderline.set_selected(true);
                    }

                    if(is_pack == false){
                        $('#numpad-return').removeAttr('disabled');
                        $('#return_img').attr('src', 'tg_pos_enhanced/static/src/img/return_product.png');
                    } else{
                        $('#numpad-return').attr('disabled', 'disabled');
                        $('#return_img').attr('src', 'tg_pos_enhanced/static/src/img/disabled_return_product.png');
                    }

                }else{
                    $('#numpad-return').attr('disabled', 'disabled');
                    $('#return_img').attr('src', 'tg_pos_enhanced/static/src/img/disabled_return_product.png');
                }
            }else{
                this.selected_orderline = undefined;
                $('#numpad-return').attr('disabled', 'disabled');
                $('#return_img').attr('src', 'tg_pos_enhanced/static/src/img/disabled_return_product.png');
            }

        },

    });

 module.Orderline = Backbone.Model.extend({
        initialize: function(attr,options){
            this.pos = options.pos;
            this.order = options.order;
            this.product = options.product;
            this.price   = options.product.get('price');
            this.quantity = 1;
            this.quantityStr = '1';
            this.discount = 0;
            this.discountStr = '0';
            this.type = 'unit';
            this.selected = false;
            this.is_return = false;
        },
        // sets a discount [0,100]%
        set_discount: function(discount){
            var disc = Math.min(Math.max(parseFloat(discount) || 0, 0),100);
            this.discount = disc;
            this.discountStr = '' + disc;
            this.trigger('change');
        },
        // returns the discount [0,100]%
        get_discount: function(){
            return this.discount;
        },
        get_discount_str: function(){
            return this.discountStr;
        },
        get_product_type: function(){
            return this.type;
        },

        // sets the quantity of the product. The quantity will be rounded according to the 
        // product's unity of measure properties. Quantities greater than zero will not get 
        // rounded to zero
        set_quantity: function(quantity){
            var self = this;
            var product_name = this.get_product().get('name');

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
                            var cur_product_name = o_lines[i].product.attributes.name;

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

                    // then we delete the pack
                    this.order.removeOrderline(this);

                }
                else{
                    this.order.removeOrderline(this);
                }
                return;
            }else{

                if(product_name[0] != '■'){
                    // packages must be sold one by one
                    var quant = Math.max(parseFloat(quantity) || 0, 0);
                    var unit = this.get_unit();
                    if(unit){
                        this.quantity    = Math.max(unit.rounding, round_pr(quant, unit.rounding));
                        this.quantityStr = this.quantity.toFixed(Math.max(0,Math.ceil(Math.log(1.0 / unit.rounding) / Math.log(10))));
                    }else{
                        this.quantity    = quant;
                        this.quantityStr = '' + this.quantity;
                    }
                }
            }
            this.trigger('change');
        },
        // return the quantity of product
        get_quantity: function(){
            return this.quantity;
        },
        get_quantity_str: function(){
            return this.quantityStr;
        },
        get_quantity_str_with_unit: function(){
            var unit = this.get_unit();
            if(unit && unit.name !== 'Unit(s)'){
                return this.quantityStr + ' ' + unit.name[0] + '.';
            }else{
                return this.quantityStr;
            }
        },
        // return the unit of measure of the product
        get_unit: function(){
            var unit_id = (this.product.get('uos_id') || this.product.get('uom_id'));
            if(!unit_id){
                return undefined;
            }
            unit_id = unit_id[0];
            if(!this.pos){
                return undefined;
            }
            return this.pos.get('units_by_id')[unit_id];
        },
        // return the product of this orderline
        get_product: function(){           
            return this.product;
        },

        get_product_tax: function(){
            var self = this;
            var product =  this.get_product(); 
            var taxes_ids = product.get('taxes_id');
            var taxes =  self.pos.get('taxes');
            var p_tax = null;

            _.each(taxes_ids, function(el) {
                var tax = _.detect(taxes, function(t) {return t.id === el;});
                p_tax = tax;
            });

            if(p_tax != null){
                var t_amount = p_tax.amount;
                var t_type = p_tax.type;

                if(t_type == "percent"){
                    return (t_amount * 100).toFixed(2) + '%';
                }
                else{
                    return t_amount.toFixed(2);
                }
            }
            else{
                    return '';
                }
        },
        // selects or deselects this orderline
        set_selected: function(selected){
            this.selected = selected;
            this.trigger('change');
        },
        // returns true if this orderline is selected
        is_selected: function(){
            return this.selected;
        },
        // when we add an new orderline we want to merge it with the last line to see reduce the number of items
        // in the orderline. This returns true if it makes sense to merge the two
        can_be_merged_with: function(orderline){
            var product_name = this.get_product().get('name');

            // do not merge if this is an item of the pack nor if this is a return (for visual)
            if(product_name[1] == '├' || this.is_return == true){
                return false;
            }

            if( this.get_product().get('id') !== orderline.get_product().get('id')){    //only orderline of the same product can be merged
                return false;
            }else if(this.get_product_type() !== orderline.get_product_type()){
                return false;
            }else if(this.get_discount() > 0){             // we don't merge discounted orderlines
                return false;
            }else if(this.price !== orderline.price){
                return false;
            }else{ 
                return true;
            }
        },
        merge: function(orderline){
            this.set_quantity(this.get_quantity() + orderline.get_quantity());
        },
        export_as_JSON: function() {
            return {
                qty: this.get_quantity(),
                price_unit: this.get_unit_price(),
                discount: this.get_discount(),
                product_id: this.get_product().get('id'),
            };
        },
        //used to create a json of the ticket, to be sent to the printer
        export_for_printing: function(){
            return {
                quantity:           this.get_quantity(),
                unit_name:          this.get_unit().name,
                price:              this.get_unit_price(),
                discount:           this.get_discount(),
                product_name:       this.get_product().get('name'),
                price_display :     this.get_display_price(),
                price_with_tax :    this.get_price_with_tax(),
                price_without_tax:  this.get_price_without_tax(),
                tax:                this.get_tax(),
                product_description:      this.get_product().get('description'),
                product_description_sale: this.get_product().get('description_sale'),
            };
        },
        // changes the base price of the product for this orderline
        set_unit_price: function(price){
            this.price = round_di(parseFloat(price) || 0, 2);
            this.trigger('change');
        },
        get_unit_price: function(){
            var rounding = this.pos.get('currency').rounding;
            return round_pr(this.price,rounding);
        },
        get_display_price: function(){
            var rounding = this.pos.get('currency').rounding;
            return  round_pr(round_pr(this.get_unit_price() * this.get_quantity(),rounding) * (1- this.get_discount()/100.0),rounding);
        },
        get_price_without_tax: function(){
            return this.get_all_prices().priceWithoutTax;
        },
        get_price_with_tax: function(){
            return this.get_all_prices().priceWithTax;
        },
        get_tax: function(){
            return this.get_all_prices().tax;
        },

        get_all_prices: function(){
            var self = this;
            var currency_rounding = this.pos.get('currency').rounding;
            var base = round_pr(this.get_quantity() * this.get_unit_price() * (1.0 - (this.get_discount() / 100.0)), currency_rounding);
            var totalTax = base;
            var totalNoTax = base;
            
            var product_list = this.pos.get('product_list');
            var product =  this.get_product(); 
            var taxes_ids = product.get('taxes_id');
            var taxes =  self.pos.get('taxes');
            var taxtotal = 0;
            _.each(taxes_ids, function(el) {
                var tax = _.detect(taxes, function(t) {return t.id === el;});

                if (tax.price_include) {
                    var tmp;
                    if (tax.type === "percent") {
                        tmp =  base - round_pr(base / (1 + tax.amount),currency_rounding); 
                    } else if (tax.type === "fixed") {
                        tmp = round_pr(tax.amount * self.get_quantity(),currency_rounding);
                    } else {
                        throw "This type of tax is not supported by the point of sale: " + tax.type;
                    }
                    tmp = round_pr(tmp,currency_rounding);
                    taxtotal += tmp;
                    totalNoTax -= tmp;
                } else {
                    var tmp;
                    if (tax.type === "percent") {
                        tmp = tax.amount * base;
                    } else if (tax.type === "fixed") {
                        tmp = tax.amount * self.get_quantity();
                    } else {
                        throw "This type of tax is not supported by the point of sale: " + tax.type;
                    }
                    tmp = round_pr(tmp,currency_rounding);
                    taxtotal += tmp;
                    totalTax += tmp;
                }
            });
            return {
                "priceWithTax": totalTax,
                "priceWithoutTax": totalNoTax,
                "tax": taxtotal,
            };
        },
    });


     module.FormClientWidget = module.ScreenWidget.extend({
        template: 'FormClientWidget',

        init: function(parent, options) {
            this._super(parent);
            var  self = this; 
        },

        hide_form_client: function(){
            $('#form-client').css('display', 'none');
            $('#cache-header-cust').css('display', 'none');
            $('#cache-right-pan').css('display', 'none');
            $('.order-container').css('display', 'block');
            $('#leftpane footer').css('display', 'block');  
        },

                // select one customer
        select_client: function(cid, cname, cfname, cmontantcumule){
            var self = this;   

            unselect_client();

            var sel_client = cname + ' ' + cfname;
            var mc = Number(cmontantcumule).toFixed(2);

            $('#selected-customer-name').html(ellipseName(sel_client));
            $('#montantCumule').html(mc);
            
            if(cmontantcumule >= 500){
                $('#selected-vip').html('<img src="tg_pos_enhanced/static/src/img/vip.png"/>');
            }else{
                $('#selected-vip').html('');
            }

            var close_button = QWeb.render('ClientRemoveWidget',{});
            $(close_button).appendTo($('#btns-customer')).click(function(){
                self.pos.get('selectedOrder').set_partner_id(0);
                unselect_client();
            });

            var edit_button = QWeb.render('ClientEditWidget',{});
            $(edit_button).appendTo($('#btns-customer')).click(function(){
                self.edit_client();
            });

            if(Number(cmontantcumule) > 0){
                var sales_button = QWeb.render('ClientSalesWidget',{});      
                $(sales_button).appendTo($('#btns-customer')).click(function(){
                    self.see_customer_sales();
                });
                $('#cust_sales_btn').attr('src', 'tg_pos_enhanced/static/src/img/see_sales.png'); 
                $('#cust_sales_btn').css('cursor', 'pointer');
            }else{
                var sales_button = QWeb.render('ClientSalesWidget',{});                         
                $(sales_button).appendTo($('#btns-customer'));
                $('#cust_sales_btn').attr('src', 'tg_pos_enhanced/static/src/img/disabled_see_sales.png'); 
                $('#cust_sales_btn').css('cursor', 'default');
            }

            //images
            $('#img-sel_cus').attr('src', 'tg_pos_enhanced/static/src/img/client.png');
            $('#img_amountcumul').attr('src', 'tg_pos_enhanced/static/src/img/montant_cumule.png');

            // css
            $('#client-btns li').css('background', '#fff');
            $('#client-btns li').css('border','1px solid gray');

            //form
            $('#input_partner_id').val(cid);
            self.pos.get('selectedOrder').set_partner_id(cid);

            close_cs_window();
        },

                // edit customer
        edit_client: function(){
            var self = this;

            var cid = $('#input_partner_id').val();

            var loaded = fetch(
                                'res.partner',
                                ['name', 
                                 'firstname', 
                                 'zip', 
                                 'phone', 
                                 'mobile', 
                                 'email',
                                 'pos_comment', 
                                 'montantCumule'],
                                [['id' , '=', parseInt(cid)]]
                                )
                .then(function(client){
                     var the_client = client[0];
                        
                        // form edit
                        $('#input_name').val(the_client.name);
                        $('#input_firstname').val(the_client.firstname || '');
                        $('#input_zip').val(the_client.zip || '');
                        $('#input_phone').val(the_client.phone || '');
                        $('#input_mobile').val(the_client.mobile || '');
                        $('#input_email').val(the_client.email || '');
                        $('#input_comment').val(the_client.pos_comment || '');
                        $('#input_partner_id').val(cid);
                });

            // error messages
            $('#error_cname').css('display', 'none');
            $('#error_cfirstname').css('display', 'none');
            $('#error_czip').css('display', 'none');
            $('#error_cphone').css('display', 'none');
            $('#error_cmobile').css('display', 'none');
            $('#error_cemail').css('display', 'none');
            $('#error-msg').css('display', 'none');

            $('#titre_form_edit_client').css('display', 'block');
            $('#titre_form_create_client').css('display', 'none');

            show_form_client();
        },

        // retrieve customer for update , after edit/create customer
        get_clients: function(letter){
            var self = this;
            var clients_list = [];
            var l_filter = [['customer', '=', true], 
                           ['name','=ilike', letter + '%']];

            if(letter == '0-9'){
                l_filter = [['customer', '=', true],
                            '|', '|', '|', '|', '|', '|', '|', '|', '|',
                            ['name','=ilike', '0%'],
                            ['name','=ilike', '1%'],
                            ['name','=ilike', '2%'],
                            ['name','=ilike', '3%'],
                            ['name','=ilike', '4%'],
                            ['name','=ilike', '5%'],
                            ['name','=ilike', '6%'],
                            ['name','=ilike', '7%'],
                            ['name','=ilike', '8%'],
                            ['name','=ilike', '9%']
                            ];
            }

                var loaded = fetch(
                                'res.partner',
                                ['id', 
                                 'name', 
                                 'firstname', 
                                 'zip', 
                                 'phone', 
                                 'mobile', 
                                 'email', 
                                 'montantCumule',  
                                 'pos_comment'],
                                l_filter
                                )
                .then(function(clients){
                     for(var i = 0, len = clients.length; i < len; i++){
                        clients_list[i] = [];
                        clients_list[i]['id'] = clients[i].id;
                        clients_list[i]['montantCumule'] = clients[i].montantCumule;
                        clients_list[i]['name'] = clients[i].name;
                        clients_list[i]['firstname'] = (clients[i].firstname == false)? '' : clients[i].firstname;
                        clients_list[i]['zip'] = clients[i].zip;
                        clients_list[i]['phone'] = clients[i].phone;
                        clients_list[i]['mobile'] = clients[i].mobile;
                        clients_list[i]['email'] = clients[i].email; 
                        clients_list[i]['comment'] = clients[i].pos_comment; 
                     };

                    // remove lines
                    $('#client-list tr').remove();

                    if(clients_list.length > 0){          
                        for(var i = 0, len = clients_list.length; i < len; i++){
                           var one_client = QWeb.render('ClientWidget',{
                                                        c_id:clients_list[i].id,
                                                        c_name:clients_list[i].name, 
                                                        c_firstname:clients_list[i].firstname,
                                                        c_zip:clients_list[i].zip,
                                                        c_phone:clients_list[i].phone,
                                                        c_mobile:clients_list[i].mobile,
                                                        c_email:clients_list[i].email,
                                                        c_comment:clients_list[i].comment,
                                                        c_montantCumule:clients_list[i].montantCumule,
                                                    });

                           $(one_client).appendTo($('#client-list')).click(function(){
                                var s_id = $('.c-id', this).html().trim();
                                var s_name = $('.c-name', this).html().trim();
                                var s_fname = $('.c-firstname', this).html().trim();
                                var s_zip = $('.c-zip', this).html().trim();
                                var s_phone = $('.c-phone', this).html().trim();
                                var s_mobile = $('.c-mobile', this).html().trim();
                                var s_email = $('.c-email', this).html().trim();
                                var s_comment = $('.c-comment', this).html().trim();
                                var s_montant_cumule = $('.c-montant-cumule', this).html().trim();
                                
                                self.select_client(s_id, s_name, s_fname, s_montant_cumule);
                           });
                        }

                    } else{
                        var no_client = QWeb.render('NoClientWidget',{});
                        $(no_client).appendTo($('#client-list'));
                    }

                    $('#nb_customers').html(clients_list.length);
                });
        },

        validateEmail: function(email) {
            var emailReg = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            return emailReg.test(email);
        },

        save_client: function(cid, cname, cfirstname, czip, cphone, cmobile, cemail, ccomment, cmontantcumule){
            var self = this;
            var c_montant_cumule = 0;

            if(cid != 0){
                c_montant_cumule = cmontantcumule;
            }

            var Partners = new instance.web.Model('res.partner');

            Partners.call('write_partner_from_pos', [cid, cname, cfirstname, czip, cphone, cmobile, cemail, ccomment],undefined,{ shadow:true })
            .fail(function(clientId){
                alert('Error : customer has not been created nor updated');
            })
            .done(function(clientId){

                var sel_client = cname.toUpperCase() + ' ' + cfirstname;
                $('#selected-customer-name').html(ellipseName(sel_client));
                $('#input_partner_id').val(clientId);

                global_letter = sel_client[0];

                self.get_clients(global_letter);
                self.pos.get('selectedOrder').set_partner_id(clientId);
                self.select_client(clientId, cname.toUpperCase(), cfirstname, c_montant_cumule);

                self.hide_form_client();
            });
        },

        renderElement: function(){
            var self = this;
            this._super();

            this.$('#input_cancel').click(this.hide_form_client);

            this.$('.input_send_formclient').click(function()
            {
                var c_name = $('#input_name').val();
                var c_firstname = $('#input_firstname').val();
                var c_zip = $('#input_zip').val();
                var c_phone = $('#input_phone').val();
                var c_mobile = $('#input_mobile').val();
                var c_email = $('#input_email').val();
                var c_comment = $('#input_comment').val();
                var c_id = $('#input_partner_id').val();
                var c_montant_cumule = $('#montantCumule').html();
                var nb_error = 0;

                // error messages
                $('#error_cname').css('display', 'none');
                $('#error_cfirstname').css('display', 'none');
                $('#error_czip').css('display', 'none');
                $('#error_cphone').css('display', 'none');
                $('#error_cmobile').css('display', 'none');
                $('#error_cemail').css('display', 'none');
                $('#error-msg').css('display', 'none');

                if (c_name == ''){
                    $('#error_cname').css('display', 'block');
                    nb_error++;
                }
                
                if (c_firstname == ''){
                    $('#error_cfirstname').css('display', 'block');
                    nb_error++;
                }

                if (c_zip.length < 4  && c_zip != ''){
                    $('#error_czip').css('display', 'block');
                    nb_error++;
                }
                
                if (c_phone.length < 8  && c_phone != ''){
                    $('#error_cphone').css('display', 'block');
                    nb_error++;
                }
                
                if (c_mobile.length < 8 && c_mobile != ''){
                    $('#error_cmobile').css('display', 'block');
                    nb_error++;
                }
                
                if (c_email != '' && !self.validateEmail(c_email)){
                    $('#error_cemail').css('display', 'block');
                    nb_error++;
                }
                
                if (nb_error > 0){
                    $('#error-msg').css('display', 'block');                
                } else{
                    self.save_client(c_id.trim(), 
                                     c_name.trim(), 
                                     c_firstname.trim(), 
                                     c_zip.trim(), 
                                     c_phone.trim(), 
                                     c_mobile.trim(), 
                                     c_email.trim(), 
                                     c_comment.trim(), 
                                     c_montant_cumule.trim()
                                     );
                }
            });
        },
    });

    module.ClientRemoveWidget = module.ScreenWidget.extend({
        template: 'ClientRemoveWidget',
    });

    module.ClientEditWidget = module.ScreenWidget.extend({
        template: 'ClientEditWidget',
    });

    module.ClientSalesWidget = module.ScreenWidget.extend({
        template: 'ClientSalesWidget',
    });

    module.TitreSelectCustomerWidget = module.ScreenWidget.extend({
        template: 'TitreSelectCustomerWidget',
    });

    module.ClientScreenWidget = module.ScreenWidget.extend({
        template:'ClientScreenWidget',  

        start: function(){
            var self = this;
            this.clients_letters_widget = new module.ClientsLettersWidget(this,{});
            this.clients_letters_widget.replace($('#placeholder-ClientsLettersWidget'));

            this.$('#id-clientscreenwidget').css('display', 'none');
        },  

        // select customer
        select_client: function(cid, cname, cfname, cmontantcumule){
            var self = this;   

                unselect_client();

                var sel_client = cname + ' ' + cfname;
                var mc = Number(cmontantcumule).toFixed(2);

                $('#selected-customer-name').html(ellipseName(sel_client));
                $('#montantCumule').html(mc);
                
                if(cmontantcumule >= 500){
                    $('#selected-vip').html('<img src="tg_pos_enhanced/static/src/img/vip.png"/>');
                }else{
                    $('#selected-vip').html('');
                }

                var close_button = QWeb.render('ClientRemoveWidget',{});
                $(close_button).appendTo($('#btns-customer')).click(function(){
                    self.pos.get('selectedOrder').set_partner_id(0);
                    unselect_client();
                });

                var edit_button = QWeb.render('ClientEditWidget',{});
                $(edit_button).appendTo($('#btns-customer')).click(function(){
                    self.edit_client();
                });


                //images
                $('#img-sel_cus').attr('src', 'tg_pos_enhanced/static/src/img/client.png');
                $('#img_amountcumul').attr('src', 'tg_pos_enhanced/static/src/img/montant_cumule.png');

                // css
                $('#client-btns li').css('background', '#fff');
                $('#client-btns li').css('border','1px solid gray');

                //form
                $('#input_partner_id').val(cid);
                self.pos.get('selectedOrder').set_partner_id(cid);


            close_cs_window();
        },

        // see customer's sales
        see_customer_sales: function(){
            $('#cache-header-cust').css('display', 'block');
            $('#cache_left_pane').css('display', 'block');
            $('#id-clientscreenwidget').css('display', 'none');
            $('#products-screen').css('display', 'none');
            $('#id_salesscreen').css('display', 'block');
        },

        // edit customer
        edit_client: function(){
            var self = this;

            var cid = $('#input_partner_id').val();

            var loaded = fetch(
                                'res.partner',
                                ['name', 
                                 'firstname', 
                                 'zip', 
                                 'phone', 
                                 'mobile', 
                                 'email',
                                 'pos_comment', 
                                 'montantCumule'],
                                [['id' , '=', parseInt(cid)]]
                                )
                .then(function(client){
                     var the_client = client[0];
                        
                        // form edit
                        $('#input_name').val(the_client.name);
                        $('#input_firstname').val(the_client.firstname || '');
                        $('#input_zip').val(the_client.zip || '');
                        $('#input_phone').val(the_client.phone || '');
                        $('#input_mobile').val(the_client.mobile || '');
                        $('#input_email').val(the_client.email || '');
                        $('#input_comment').val(the_client.pos_comment || '');
                        $('#input_partner_id').val(cid);
                });

            // error messages
            $('#error_cname').css('display', 'none');
            $('#error_cfirstname').css('display', 'none');
            $('#error_czip').css('display', 'none');
            $('#error_cphone').css('display', 'none');
            $('#error_cmobile').css('display', 'none');
            $('#error_cemail').css('display', 'none');
            $('#error-msg').css('display', 'none');

            $('#titre_form_edit_client').css('display', 'block');
            $('#titre_form_create_client').css('display', 'none');

            show_form_client();
        },


        // get customers
        get_clients: function(letter){
            var self = this;
            var clients_list = [];
            var l_filter = [['customer', '=', true], 
                           ['name','=ilike', letter + '%']];

            if(letter == '0-9'){
                l_filter = [['customer', '=', true],
                            '|', '|', '|', '|', '|', '|', '|', '|', '|',
                            ['name','=ilike', '0%'],
                            ['name','=ilike', '1%'],
                            ['name','=ilike', '2%'],
                            ['name','=ilike', '3%'],
                            ['name','=ilike', '4%'],
                            ['name','=ilike', '5%'],
                            ['name','=ilike', '6%'],
                            ['name','=ilike', '7%'],
                            ['name','=ilike', '8%'],
                            ['name','=ilike', '9%']
                            ];
            } 

            var loaded = fetch(
                                'res.partner',
                                ['id', 
                                'name', 
                                'firstname', 
                                'zip', 'phone', 
                                'mobile', 
                                'email', 
                                'pos_comment',
                                'montantCumule'],
                                l_filter
                                )
                .then(function(clients){
                     for(var i = 0, len = clients.length; i < len; i++){
                        clients_list[i] = [];
                        clients_list[i]['id'] = clients[i].id;
                        clients_list[i]['montantCumule'] = clients[i].montantCumule;
                        clients_list[i]['name'] = clients[i].name;
                        clients_list[i]['firstname'] = (clients[i].firstname == false)? '' : clients[i].firstname;
                        clients_list[i]['zip'] = clients[i].zip;
                        clients_list[i]['phone'] = clients[i].phone;
                        clients_list[i]['mobile'] = clients[i].mobile;
                        clients_list[i]['email'] = clients[i].email; 
                        clients_list[i]['comment'] = clients[i].pos_comment; 
                     };

                    // remove lines
                    $('#client-list tr').remove();

                    if(clients_list.length > 0){          
                        for(var i = 0, len = clients_list.length; i < len; i++){
                           var one_client = QWeb.render('ClientWidget',{
                                                        c_id:clients_list[i].id,
                                                        c_name:clients_list[i].name, 
                                                        c_firstname:clients_list[i].firstname,
                                                        c_zip:clients_list[i].zip,
                                                        c_phone:clients_list[i].phone,
                                                        c_mobile:clients_list[i].mobile,
                                                        c_email:clients_list[i].email,
                                                        c_comment:clients_list[i].comment,
                                                        c_montantCumule:clients_list[i].montantCumule,
                                                    });

                           $(one_client).appendTo($('#client-list')).click(function(){
                                var s_id = $('.c-id', this).html().trim();
                                var s_name = $('.c-name', this).html().trim();
                                var s_fname = $('.c-firstname', this).html().trim();
                                var s_zip = $('.c-zip', this).html().trim();
                                var s_phone = $('.c-phone', this).html().trim();
                                var s_mobile = $('.c-mobile', this).html().trim();
                                var s_email = $('.c-email', this).html().trim();
                                var s_comment = $('.c-comment', this).html().trim();
                                var s_montant_cumule = $('.c-montant-cumule', this).html().trim();
                                                    
                                self.select_client(s_id, s_name, s_fname, s_montant_cumule);
                           });
                        }

                    } else{
                        var no_client = QWeb.render('NoClientWidget',{});
                        $(no_client).appendTo($('#client-list'));
                    }

                    $('#nb_customers').html(clients_list.length);
                });
        },  

        renderElement: function(){
            var self = this;
            this._super();
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

            this.$('#cs-closebtn').click(function(){
                close_cs_window();
            });

            this.$('#cs-refreshbtn').click(function(){
                self.get_clients(global_letter);
            });

            this.$('#cs-clearsearchbtn').click(function(){
                $('#input_search').val('');
            });

            this.$('#cs-searchbtn').click(function(){
                var l = $('#input_search').val().trim();

                if(l != ''){
                    $('#input_search').val(l);
                    self.get_clients(l);
                }
            });

            this.$('#input_search').keypress(function(e) {
                if(e.which == 13) {
                    var l = $(this).val().trim();

                    if(l != ''){
                        $('#input_search').val(l);
                        self.get_clients(l);
                    }
                }
            });
        },
    });

    module.SaleWidget = module.ScreenWidget.extend({
        template: 'SaleWidget',

        init: function(parent, options) {
            this._super(parent);
            var  self = this; 
        },
    });
    

    module.SalesScreenWidget = module.ScreenWidget.extend({
        template : 'SalesScreenWidget',

        init: function(parent, options) {
            var self = this;
            options = options || {};
            this._super(parent,options);

            this.show_histo_handler = function(){
                setInterval(function(){
                    var sales_visibility = $('#id_salesscreen').css('display');
                    if( sales_visibility == 'block'){    

                        if(can_show_histo == true){
                            self.show_histo();
                            can_show_histo = false;
                        }

                    }else{
                        can_show_histo = true;
                    }
                },500);
            };
        },

        show_histo: function(){
            var self = this;
            
            // remove sales lines
            $('#sales-list tr').remove();

            var cid = $('#input_partner_id').val();
            if(cid && cid != 0){

                var Mread = new instance.web.Model('pos.order');

                Mread.call('get_partner_orders', [cid], undefined, { shadow:true })
                .fail(function(orders){
                    alert('Partner orders : get_partner_orders = failed');
                })
                .done(function(orders){
                    
                    if(orders.length > 0){ 
                        for(var i = 0, len = orders.length; i < len; i++){

                            var one_sale = QWeb.render('SaleWidget',{
                                            s_id:orders[i].id,
                                            s_posref:orders[i].pos_reference,
                                            s_date:orders[i].date_order,
                                            s_name:orders[i].name,
                                            s_state:_t(orders[i].state),
                                            s_cashier:orders[i].cashier_name || '',
                                            s_discount:orders[i].discount.toFixed(2),
                                            s_total:orders[i].amount_total.toFixed(2),
                                            s_done:'false',
                                        }); 
                            
                            var tr_line_id = 'l_' + orders[i].id;
                            var tr_detail_id = 'd_' + orders[i].id;
                            var tr_oline_id = 'dl_' + orders[i].id;

                            $(one_sale).appendTo($('#sales-list'));    

                            // replace TRs id
                            $('#lx').replaceWith('<tr class="sale_line" id="' + tr_line_id + '">' + $('#lx').html() + "</tr>");
                            $('#dx').replaceWith('<tr class="sale_detail" id="' + tr_detail_id + '">' + $('#dx').html() + "</tr>");
                            $('#dlx').replaceWith('<tbody class="detail-list" id="' + tr_oline_id + '">' + $('#dlx').html() + "</tbody>");

                            // show detail
                            $('#' + tr_line_id).click(function(){
                                var line_id = $(this).attr('id');
                                var sel_id = line_id.trim().substring(2, line_id.length);

                                $('#d_' + sel_id).css('display', 'table-row');
                                $('#l_' + sel_id).css('background-color', '#f9b625');
                                $('#l_' + sel_id).css('font-weight', 'bold');

                                var done_already = $('#l_' + sel_id + ' .s-done').html().trim();

                                // this is to not fetch DB again once done
                                if(done_already != 'true'){
                                    self.get_sale_detail(parseInt(sel_id), 'dl_' + sel_id);
                                }
                            });
                            
                            // hide detail
                            $('#' + tr_detail_id).click(function(){
                                var detail_id = $(this).attr('id');
                                var sel_id = detail_id.trim().substring(2, detail_id.length);

                                $(this).css('display', 'none');
                                $('#l_' + sel_id).css('background-color', 'transparent');
                                $('#l_' + sel_id).css('font-weight', 'normal');
                            });
                        }
                    }
                    else{
                        var no_sale = QWeb.render('NoSaleWidget',{});
                        $(no_sale).appendTo($('#sales-list'));
                    }

                    $('#cust_sales_name').html($('#selected-vip').html() + ' ' 
                            + $('#selected-customer-name').html());
                });
            }
        },

        get_sale_detail: function(sid, tr_id){
            var self = this;
            oline_list = []; 

            if(! sid){
                return false;
            }else{

                var loaded = fetch(
                                'pos.order.line',
                                [
                                    'product_id',
                                    'price_unit',
                                    'price_subtotal',
                                    'price_subtotal_incl',
                                    'qty',
                                    'discount',
                                ],
                                [['order_id', '=', sid]]
                                )
                .then(function(o_lines){

                    var p_ids = [];

                    for(var i = 0, len = o_lines.length; i < len; i++){
                        p_ids[i] = o_lines[i].product_id[0];

                        oline_list[i]               = [];
                        oline_list[i]['product_id'] = o_lines[i].product_id[0];
                        oline_list[i]['price_unit'] = o_lines[i].price_unit;
                        oline_list[i]['amount']     = o_lines[i].price_subtotal_incl;
                        oline_list[i]['qty']        = o_lines[i].qty;
                        oline_list[i]['discount']   = o_lines[i].discount;
                    }

                    // get product name
                    return fetch(
                                'product.product',
                                ['id', 'name'],
                                [['id', 'in', p_ids]]
                                );

                }).then(function(products){ 

                    if(oline_list.length > 0){  
      
                        for(var i = 0, len = oline_list.length; i < len; i++){

                            // product name
                            var p_name = '';
                            for(var u = 0, lenu = products.length; u < lenu; u++){
                                if(products[u].id == oline_list[i].product_id){
                                        p_name = ' ● ' + products[u].name;
                                }
                            }

                            var one_line  = QWeb.render('DetailWidget',{
                                            d_product:p_name,
                                            d_price_unit:oline_list[i].price_unit.toFixed(2),
                                            d_qty:oline_list[i].qty,
                                            d_discount:oline_list[i].discount.toFixed(2),
                                            d_amount:oline_list[i].amount.toFixed(2),
                                        });

                            $(one_line).appendTo($('#' + tr_id)); 
                        }
                    }

                    $('#l_' + sid + ' .s-done').html('true');

                });
            }

        },

        close_sales_window: function(){
            $('#sales-list tr').remove();
            $('#cust_sales_name').html('');

            $('#cache_left_pane').css('display', 'none');
            $('#cache-header-cust').css('display', 'none');
            $('#id_salesscreen').css('display', 'none');
            $('#products-screen').css('display', 'block');
           
        },

        renderElement: function(){
            var self = this;
            this._super();
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

            this.$('#cs-salesclosebtn').click(function(){
                self.close_sales_window();
            });

            $(window).unbind('show_histo',this.show_histo_handler);
            $(window).bind('show_histo',this.show_histo_handler);

            setInterval(function(){
                    var sales_visibility = $('#id_salesscreen').css('display');
                    if( sales_visibility == 'block'){    

                        if(can_show_histo == true){
                            self.show_histo();
                            can_show_histo = false;
                        }

                    }else{
                        can_show_histo = true;
                    }
                },500);

        },

        bind_events:function(){
            $(window).show_histo(function(){     
            });
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

            this.$('#cs-salesclosebtn').click(function(){
                self.close_sales_window();
            });
        },
    });
    
    
    module.tgMessageWidget = module.ScreenWidget.extend({
        template: 'tgMessageWidget',
        
        init: function(parent, options) {
            this._super(parent);
            var  self = this;     
        },
        
        close_message_read: function(){
            var  self = this;     
            var mid = $('#mid').val();
            
            posid = parseInt(posid);
            mid = parseInt(mid);
            
            if (mid != 0 && posid != 0){
                var Mread = new instance.web.Model('pos.message.read');

                Mread.call('write_pos_message_read', [mid, posid], undefined, { shadow:true })
                .fail(function(confirmed){
                    alert('POS messaging : close_message_read = failed');
                })
                .done(function(confirmed){
                    $('#msg_frame').css('display', 'none');
                });
            }else{
                console.log("POS messaging : close_message_read = mid not set!");
            }
        },
        
        renderElement: function() {
            var self = this;
            this._super();
            
            this.$('#message-closebtn').click(function(){
                self.close_message_read();
            });
        },
    });

    module.tgPosWidget = module.PosWidget.include({
        template: 'PosWidget',  

        init: function(parent, options) {
            this._super(parent);
            var  self = this;     
        },

         // get current POS id
        get_cur_pos_config_id: function(){
            var self = this;
            var config = self.pos.get('pos_config');
            var config_id = null;
                     
            if(config){
                config_id = config.id;
                
                return config_id;
            }        
            return '';    
        },

        get_cashiers: function(config_id){
            var self = this;
            var cashier_list = [];

            var loaded = fetch('pos.cashier',['cashier_name'],[['pos_config_id','=', parseInt(config_id)], ['active', '=','true']])
                .then(function(cashiers){
                     for(var i = 0, len = cashiers.length; i < len; i++){
                        cashier_list.push(cashiers[i].cashier_name);
                     }

                     nbCashiers = cashier_list.length;

                    if(nbCashiers > 0){

                        if(nbCashiers > 1){
                            var new_option = '<option value="nobody"></option>\n';
                            self.$('#cashier-select').html(content + new_option);
                        }
                        
                        for(var i = 0, len = cashier_list.length; i < len; i++){
                            var content = self.$('#cashier-select').html();
                            var new_option = '<option value="' + cashier_list[i] + '">' + cashier_list[i] + '</option>\n';
                            self.$('#cashier-select').html(content + new_option);
                            }

                        self.$('#AlertNoCashier').css('display', 'none');
                        self.$('#cashier-select').selectedIndex = 0;
                        globalCashier = self.$('#cashier-select').val();
                        cashier_change(globalCashier);

                    } else{

                        // if there are no cashier
                        self.$('#AlertNoCashier').css('display', 'block');
                        self.$('.gotopay-button').attr('disabled', 'disabled');
                    }
                });
        }, 

        renderElement: function() {
            var self = this;
            this._super();

            this.$('#btn-findcust').click(function(){
                $('#id-clientscreenwidget').css('display', 'block');
                $('#input_search').val('');
                $('#products-screen').css('display', 'none');

                $('#titleSelectCustomer').css('display', 'inline');
                $('#titleSelectSponsor').css('display', 'none');
                $('#cache_left_pane').css('display', 'block');
            });

            this.$('#btn-addcust').click(function(){

                unselect_client();

                $('#id-clientscreenwidget').css('display', 'none');
                $('#products-screen').css('display', 'block');           
                $('.order-container').css('display', 'none');
                $('#leftpane footer').css('display', 'none');
                $('#form-client').css('display', 'block');
                $('#titre_form_edit_client').css('display', 'none');
                $('#titre_form_create_client').css('display', 'block');
                $('#cache-header-cust').css('display', 'block');
                $('#cache-right-pan').css('display', 'block');

            });

            $('#id_salesscreen').css('display', 'none');

            self.$('#cashier-select').change(function(){
                var name = this.value;
                cashier_change(name);
            });

            global_pwd = self.pos.attributes.pwd;
            
            var pos_config = self.pos.get('pos_config');         
            if (pos_config != null){
                posid = pos_config.id;
            } 
            
            get_pos_messages();
        },

        build_widgets: function() {
            var self = this;
            this._super();

            this.clients = new module.ClientScreenWidget(this, {});
            this.clients.appendTo($('#rightpane'));

            this.pack = new module.PackScreenWidget(this, {});
            this.pack.appendTo($('#rightpane'));

            this.formclient = new module.FormClientWidget(this, {});
            this.formclient.replace(this.$('#placeholder-CustFormWidget'));

            this.gotopay = new module.GoToPayWidget(this, {});  
            this.gotopay.replace(this.$('#placeholder-GoToPayWidget')); 

            this.sales = new module.SalesScreenWidget(this,{});
            this.sales.appendTo($('#rightpane'));

            this.pwd_alert = new module.AlertPwdWidget(this,{});
            this.pwd_alert.replace(this.$('.placeholder-AlertPwdWidget')); 
            
            this.msgs = new module.tgMessageWidget(this, {});
            this.msgs.replace(this.$('.placeholder-MessageWidget'));

            var label_deco = $('#label_deconexion').html();

            // remove old header-button
            this.$('.header-button').remove();

            this.close1_button = new module.HeaderButtonWidget(this,{
                label: label_deco,
                action: function(){ self.try_close(); },
            });
            this.close1_button.appendTo(this.$('#rightheader'));

            this.client_button = new module.HeaderButtonWidget(this,{
                label: _t('Self-Checkout'),
                action: function(){ self.screen_selector.set_user_mode('client'); },
            });
            this.client_button.appendTo(this.$('#rightheader'));
        },
    });
};

openerp.point_of_sale = function(instance) {
    instance.point_of_sale = {};

    var module = instance.point_of_sale;

    openerp_pos_db(instance,module);            // import db.js
    openerp_pos_models(instance,module);        // import pos_models.js
    tg_pos_enhanced_models(instance,module);    // import tg_pos_enhanced_models/tg_pos_enhanced.js
    openerp_pos_basewidget(instance,module);    // import pos_basewidget.js
    openerp_pos_keyboard(instance,module);      // import pos_keyboard_widget.js
    openerp_pos_scrollbar(instance,module);     // import pos_scrollbar_widget.js
    openerp_pos_screens(instance,module);       // import pos_screens.js
    openerp_pos_widgets(instance,module);       // import pos_widgets.js
    openerp_pos_devices(instance,module);       // import pos_devices.js

    tg_pos_enhanced(instance,module);           // import tg_pos_enhanced/tg_pos_enhanced.js

    instance.web.client_actions.add('pos.ui', 'instance.point_of_sale.PosWidget');
};