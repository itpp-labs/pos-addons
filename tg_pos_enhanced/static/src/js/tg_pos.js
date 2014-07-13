
function tg_pos_enhanced_models(instance, module){ //module is instance.point_of_sale
    var module = instance.point_of_sale;

    String.prototype.setCharAt = function(index,chr) {
        if(index > this.length-1) return str;
        return this.substr(0,index) + chr + this.substr(index+1);
    }

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        initialize:function(session, attributes){

            PosModelSuper.prototype.initialize.call(this, session, attributes);
            this.set({'pwd':null})
        },
        load_server_data: function(){
            var self = this;

            var loaded = self.fetch('res.users',['name','company_id', 'pos_manager_pwd'],[['id','=',this.session.uid]])
                .then(function(users){
                    self.user = users[0];
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
                    [['id','=',users[0].company_id[0]]],
                    {show_address_only: true});
                }).then(function(companies){
                    self.company = companies[0];

                    return self.fetch('product.uom', null, null);
                }).then(function(units){
                    self.units = units;
                    var units_by_id = {};
                    for(var i = 0, len = units.length; i < len; i++){
                        units_by_id[units[i].id] = units[i];
                    }
                    self.units_by_id = units_by_id;

                    return self.fetch('res.users', ['name','ean13'], [['ean13', '!=', false]]);
                }).then(function(users){
                    self.users = users;

                    return self.fetch('res.partner', ['name','ean13'], [['ean13', '!=', false]]);
                }).then(function(partners){
                    self.partners = partners;

                    return self.fetch('account.tax', ['name','amount', 'price_include', 'type']);
                }).then(function(taxes){
                    self.taxes = taxes;

                    return self.fetch(
                        'pos.session',
                        ['id', 'journal_ids','name','user_id','config_id','start_at','stop_at'],
                        [['state', '=', 'opened'], ['user_id', '=', self.session.uid]]
                    );
                }).then(function(pos_sessions){
                    self.pos_session = pos_sessions[0];

                    return self.fetch(
                        'pos.config',
                        ['name','journal_ids','warehouse_id','journal_id','pricelist_id',
                         'iface_self_checkout', 'iface_led', 'iface_cashdrawer',
                         'iface_payment_terminal', 'iface_electronic_scale', 'iface_barscan',
                         'iface_vkeyboard','iface_print_via_proxy','iface_auto_print', 'iface_scan_via_proxy',
                         'iface_cashdrawer','iface_invoicing','iface_big_scrollbars',
                         'receipt_header','receipt_footer','proxy_ip',
                         'state','sequence_id','session_ids'],
                        [['id','=', self.pos_session.config_id[0]]]
                    );
                }).then(function(configs){
                    self.config = configs[0];
                    self.config.iface_print_via_proxy2 = self.config.iface_print_via_proxy;

                    self.config.use_proxy = self.config.iface_payment_terminal ||
                                            self.config.iface_electronic_scale ||
                                            self.config.iface_print_via_proxy  ||
                                            self.config.iface_scan_via_proxy   ||
                                            self.config.iface_cashdrawer;

                    return self.fetch('product.pricelist',['currency_id'],[['id','=',self.config.pricelist_id[0]]]);
                }).then(function(pricelists){
                    self.pricelist = pricelists[0];

                    return self.fetch('res.currency',['symbol','position','rounding','accuracy'],[['id','=',self.pricelist.currency_id[0]]]);
                }).then(function(currencies){
                    self.currency = currencies[0];

                    /*
                    return (new instance.web.Model('decimal.precision')).call('get_precision',[['Account']]);
                }).then(function(precision){
                    self.accounting_precision = precision;
                    console.log("PRECISION",precision);
*/
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
                        {pricelist: self.pricelist.id} // context for price
                    );
                }).then(function(products){
                    self.db.add_products(products);

                    return self.fetch(
                        'account.bank.statement',
                        ['account_id','currency','journal_id','state','name','user_id','pos_session_id'],
                        [['state','=','open'],['pos_session_id', '=', self.pos_session.id]]
                    );
                }).then(function(bankstatements){
                    var journals = [];
                    _.each(bankstatements,function(statement) {
                        journals.push(statement.journal_id[0])
                    });
                    self.bankstatements = bankstatements;
                    return self.fetch('account.journal', undefined, [['id','in', journals]]);
                }).then(function(journals){
                    self.journals = journals;

                    // associate the bank statements with their journals.
                    var bankstatements = self.bankstatements
                    for(var i = 0, ilen = bankstatements.length; i < ilen; i++){
                        for(var j = 0, jlen = journals.length; j < jlen; j++){
                            if(bankstatements[i].journal_id[0] === journals[j].id){
                                bankstatements[i].journal = journals[j];
                                bankstatements[i].self_checkout_payment_method = journals[j].self_checkout_payment_method;
                            }
                        }
                    }
                    self.cashregisters = bankstatements;

                    // Load the company Logo

                    self.company_logo = new Image();
                    self.company_logo.crossOrigin = 'anonymous';
                    var  logo_loaded = new $.Deferred();
                    self.company_logo.onload = function(){
                        var img = self.company_logo;
                        var ratio = 1;
                        var targetwidth = 300;
                        var maxheight = 150;
                        if( img.width !== targetwidth ){
                            ratio = targetwidth / img.width;
                        }
                        if( img.height * ratio > maxheight ){
                            ratio = maxheight / img.height;
                        }
                        var width  = Math.floor(img.width * ratio);
                        var height = Math.floor(img.height * ratio);
                        var c = document.createElement('canvas');
                            c.width  = width;
                            c.height = height
                        var ctx = c.getContext('2d');
                            ctx.drawImage(self.company_logo,0,0, width, height);

                        self.company_logo_base64 = c.toDataURL();
                        window.logo64 = self.company_logo_base64;
                        logo_loaded.resolve(); //TODO uncomment it and fix problems
                    };
                    self.company_logo.onerror = function(){
                        logo_loaded.reject();
                    };
                    self.company_logo.src = window.location.origin + '/web/binary/company_logo';

                    return logo_loaded;
                });

            return loaded;
        }
    });
};

function tg_pos_enhanced(instance, module){ //module is instance.point_of_sale
    var module = instance.point_of_sale;
    var QWeb = instance.web.qweb;
    _t = instance.web._t;

    var round_di = instance.web.round_decimals;
    var round_pr = instance.web.round_precision;

    // // unselect customer
    module.unselect_client = function(){

            $('#selected-customer-name').html('?');
            $('#btns-customer').html('');
            $('#montantCumule').html('');
            $('#selected-vip').html('');

            //images
            $('#img-sel_cus').attr('src', '/tg_pos_enhanced/static/src/img/disabled_client.png');
            $('#img_amountcumul').attr('src', '/tg_pos_enhanced/static/src/img/disabled_montant_cumule.png');

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
            $('.screens').css('display', 'block');
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
            //$('.order-container').css('display', 'none');
            $('.order-container').addClass('oe_hidden');
            //$('#leftpane footer').css('display', 'none');
            $('.pos-leftpane .pads').addClass('oe_hidden');
            //$('#form-client').css('display', 'block');
            $('#form-client').removeClass('oe_hidden');

            //$('#cache-header-cust').css('display', 'block');
            $('#cache-header-cust').removeClass('oe_hidden');
            //$('#cache-right-pan').css('display', 'block');
            $('#cache-right-pan').removeClass('oe_hidden')
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

                module.unselect_client();

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
                    module.unselect_client();
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
                    $('#cust_sales_btn').attr('src', '/tg_pos_enhanced/static/src/img/see_sales.png');
                    $('#cust_sales_btn').css('cursor', 'pointer');
                }else{
                    var sales_button = QWeb.render('ClientSalesWidget',{});
                    $(sales_button).appendTo($('#btns-customer'));
                    $('#cust_sales_btn').attr('src', '/tg_pos_enhanced/static/src/img/disabled_see_sales.png');
                    $('#cust_sales_btn').css('cursor', 'default');
                }

                //images
                $('#img-sel_cus').attr('src', '/tg_pos_enhanced/static/src/img/client.png');
                $('#img_amountcumul').attr('src', '/tg_pos_enhanced/static/src/img/montant_cumule.png');

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
            $('.screens').css('display', 'none');
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
                    $('#return_img').attr('src', '/tg_pos_enhanced/static/src/img/return_product.png');
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
                    self.validate_order();
                },
            });

            if( this.pos.config.iface_invoicing ){
                this.add_action_button({
                        label: 'Invoice',
                        name: 'invoice',
                        icon: '/point_of_sale/static/src/img/icons/png48/invoice.png',
                        click: function(){
                            self.validate_order({invoice: true});
                        },
                    });
            }

            if( this.pos.config.iface_cashdrawer ){
                this.add_action_button({
                        label: _t('Cash'),
                        name: 'cashbox',
                        icon: '/point_of_sale/static/src/img/open-cashbox.png',
                        click: function(){
                            self.pos.proxy.open_cashbox();
                        },
                    });
            }

            this.update_payment_summary();
            this.focus_selected_line();
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
                self.update_payment_summary();
            });

            this.$('#btn-delremspec').hide();
            this.$('#btn-call-manager').show();

            this.$('#btn-call-manager').click(function() {
                self.call_manager_special_discount();
            });

            this.update_payment_summary();

            /*
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
             */
        },
        validate_order:function(options){
            var iface_print_via_proxy = this.pos.config.iface_print_via_proxy;
            var iface_auto_print = this.pos.config.iface_auto_print;
            if (iface_print_via_proxy && ! iface_auto_print){
                this.pos.config.iface_print_via_proxy = false;
                this._super(options);
                this.pos.config.iface_print_via_proxy = iface_print_via_proxy;
            }else{
                this._super(options);
            }
        },

        update_payment_summary: function() {
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

            var rounding = this.pos.currency.rounding;
            var round_pr = instance.web.round_precision
            remaining = round_pr(remaining, rounding);

            this.$('#payment-due-total').html(this.format_currency(totalDeDepart));
            this.$('#soustotalapresremises').html(this.format_currency(sousTotalApayer));
            this.$('#payment-paid-total').html(this.format_currency(paidTotal));
            this.$('#payment-remaining').html(this.format_currency(remaining));
            this.$('#payment-change').html(this.format_currency(monnaieArendre));


            /*
            //in 8.0 currentOrder.selected_orderline always false if we use
            // function self.pos_widget.screen_selector.set_current_screen('payment');
            // in GoToPayWidget
            if(currentOrder.selected_orderline === undefined){
                remaining = 1;  // What is this ?
            }
             */

            if(this.pos_widget.action_bar){
                this.pos_widget.action_bar.set_button_disabled('validation', (sousTotalApayer < 0 || remaining > 0 || totalDeDepart <= 0));
            }
        },

    });

    module.tgReceiptScreenWidget = module.ReceiptScreenWidget.include({

        refresh: function() {
            this._super();

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

        print:function(){
            if (this.pos.config.iface_print_via_proxy2){
                var currentOrder = this.pos.get('selectedOrder');
                this.pos.proxy.print_receipt(currentOrder.export_for_printing());
            }else{
                window.print();
            }

        },

        renderElement: function(){
            var self = this;
            this._super();
            /*
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
*/
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
                $('#return_img').attr('src', '/tg_pos_enhanced/static/src/img/disabled_return_product.png');
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

                $(window)[0].screen_selector.current_screen.update_payment_summary();
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

           if(!cur_oline.product.is_pack){

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


    var OrderSuper = module.Order;
    module.Order = module.Order.extend({
        destroy: function(){
            OrderSuper.prototype.destroy.call(this)
            //TODO remove it from here
            $('#cache_left_pane').css('display', 'none');
            $('#cache-header-cust').css('display', 'none');

            $('#numpad-return').attr('disabled', 'disabled');
            $('#return_img').attr('src', '/tg_pos_enhanced/static/src/img/disabled_return_product.png');

            if(nbCashiers > 1){
                $('#cashier-select').val('nobody');
                globalCashier = 'nobody';
                cashier_change(globalCashier);
            }

            module.unselect_client();

            // check for new messages
            get_pos_messages();
        },
        initialize: function(attributes){
            OrderSuper.prototype.initialize.call(this, attributes)
            this.set({
                 partner_id:     null,
                 partner_name:   null,
                 cashier_name:   null,
                 special_discount: null,
                 special_disobj: null
                });
            return this;
        },

        set_cashier_name: function(name){
            this.set('cashier_name', name);
        },

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

        getDiscountBefore: function() {
            return OrderSuper.prototype.getDiscountTotal.call(this)
        },
        getDiscountAfter: function() {
            return parseFloat($('#enter_special_discount').val());
        },
        getDiscountTotal: function() {
            return this.getDiscountBefore() + this.getDiscountAfter() ;
        },

        getChange: function() {
            return this.getPaidTotal() + this.getDiscountAfter() - this.getTotalTaxIncluded();
        },
        getDueLeft: function() {
            return parseFloat($('#payment-remaining').html());
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
        get_special_discount: function(){
            return parseFloat($('#enter_special_discount').val());
        },

        get_partner_id: function(){
            return $('#input_partner_id').val();
        },

        // exports a JSON for receipt printing
        export_for_printing: function(){
            var res = OrderSuper.prototype.export_for_printing.call(this);
            res.total_discount = this.getDiscountAfter();
            res.client = this.get_partner_id();
            res.partner_id = this.get_partner_id();
            res.currency = this.pos.currency;
            return res;
        },
        export_as_JSON: function() {
            var res = OrderSuper.prototype.export_as_JSON.call(this);
            var rounding = this.pos.currency.rounding;
            res.amount_return = round_pr(this.getChange(), rounding);
            res.discount = this.getDiscountAfter();
            res.partner_id = this.get('partner_id');
            res.cashier_name = this.pos.get('selectedOrder').get('cashier_name');
            res.special_discount = this.get_special_discount();
            res.special_disobj = this.pos.get('selectedOrder').get('special_disobj');

            return res;
        },

        selectLine: function(line){
            if(line){
                var product_name = line.product.name;
                var is_pack = line.product.is_pack;

                if(product_name[1] != '├'){
                   // this.selected_orderline.set_selected(undefined);

                    if(line !== this.selected_orderline){
                        if(this.selected_orderline){
                            this.selected_orderline.set_selected(false);
                        }
                        this.selected_orderline = line;
                        this.selected_orderline.set_selected(true);
                    }

                    if(!is_pack){
                        $('#numpad-return').removeAttr('disabled');
                        $('#return_img').attr('src', '/tg_pos_enhanced/static/src/img/return_product.png');
                    } else{
                        $('#numpad-return').attr('disabled', 'disabled');
                        $('#return_img').attr('src', '/tg_pos_enhanced/static/src/img/disabled_return_product.png');
                    }

                }else{
                    $('#numpad-return').attr('disabled', 'disabled');
                    $('#return_img').attr('src', '/tg_pos_enhanced/static/src/img/disabled_return_product.png');
                }
            }else{
                this.selected_orderline = undefined;
                $('#numpad-return').attr('disabled', 'disabled');
                $('#return_img').attr('src', '/tg_pos_enhanced/static/src/img/disabled_return_product.png');
            }

        },

    });

    var OrderlineSuper = module.Orderline;

    module.Orderline = module.Orderline.extend({
        initialize: function(attr,options){
            OrderlineSuper.prototype.initialize.call(this, attr, options)
            this.is_return = false;
        },
        // sets the quantity of the product. The quantity will be rounded according to the
        // product's unity of measure properties. Quantities greater than zero will not get
        // rounded to zero
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
                    OrderlineSuper.prototype.set_quantity.call(this, quantity);
                    return;
                }
            }
            this.trigger('change');
        },
        get_quantity_str_with_unit: function(){
            var unit = this.get_unit();
            if(unit && unit.name !== 'Unit(s)'){
                return this.quantityStr + ' ' + unit.name[0] + '.';
            }else{
                return this.quantityStr;
            }
        },
        get_product_tax: function(){
            var self = this;
            var product =  this.get_product();
            var taxes_ids = product.taxes_id;
            var taxes =  self.pos.taxes;
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

        get_unit_price: function(){
            var rounding = this.pos.currency.rounding;
            return round_pr(this.price,rounding);
        },
        get_display_price: function(){
            var rounding = this.pos.currency.rounding;
            return  round_pr(round_pr(this.get_unit_price() * this.get_quantity(),rounding) * (1- this.get_discount()/100.0),rounding);
        },

        get_all_prices: function(){
            var self = this;
            var currency_rounding = this.pos.currency.rounding;
            var base = round_pr(this.get_quantity() * this.get_unit_price() * (1.0 - (this.get_discount() / 100.0)), currency_rounding);
            var totalTax = base;
            var totalNoTax = base;

            var product =  this.get_product();
            var taxes_ids = product.taxes_id;
            var taxes =  self.pos.taxes;
            var taxtotal = 0;
            var taxdetail = {};
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
                    taxdetail[tax.id] = tmp;
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
                    taxdetail[tax.id] = tmp;
                }
            });
            return {
                "priceWithTax": totalTax,
                "priceWithoutTax": totalNoTax,
                "tax": taxtotal,
                "taxDetails": taxdetail,
            };
        }
    });


     module.FormClientWidget = module.ScreenWidget.extend({
        template: 'FormClientWidget',

        init: function(parent, options) {
            this._super(parent);
            var  self = this;
        },

        hide_form_client: function(){
            //$('#form-client').css('display', 'none');
            $('#form-client').addClass('oe_hidden');
            //$('#cache-header-cust').css('display', 'none');
            $('#cache-header-cust').addClass('oe_hidden');
            //$('#cache-right-pan').css('display', 'none');
            $('#cache-right-pan').addClass('oe_hidden')
            //$('.order-container').css('display', 'block');
            $('.order-container').removeClass('oe_hidden');
            //$('#leftpane footer').css('display', 'block');
            $('.pos-leftpane .pads').removeClass('oe_hidden');
        },

                // select one customer
        select_client: function(cid, cname, cfname, cmontantcumule){
            var self = this;

            module.unselect_client();

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
                module.unselect_client();
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
                $('#cust_sales_btn').attr('src', '/tg_pos_enhanced/static/src/img/see_sales.png');
                $('#cust_sales_btn').css('cursor', 'pointer');
            }else{
                var sales_button = QWeb.render('ClientSalesWidget',{});
                $(sales_button).appendTo($('#btns-customer'));
                $('#cust_sales_btn').attr('src', '/tg_pos_enhanced/static/src/img/disabled_see_sales.png');
                $('#cust_sales_btn').css('cursor', 'default');
            }

            //images
            $('#img-sel_cus').attr('src', '/tg_pos_enhanced/static/src/img/client.png');
            $('#img_amountcumul').attr('src', '/tg_pos_enhanced/static/src/img/montant_cumule.png');

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

                module.unselect_client();

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
                    module.unselect_client();
                });

                var edit_button = QWeb.render('ClientEditWidget',{});
                $(edit_button).appendTo($('#btns-customer')).click(function(){
                    self.edit_client();
                });


                //images
                $('#img-sel_cus').attr('src', '/tg_pos_enhanced/static/src/img/client.png');
                $('#img_amountcumul').attr('src', '/tg_pos_enhanced/static/src/img/montant_cumule.png');

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
            $('.screens').css('display', 'none');
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
            $('.screens').css('display', 'block');

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
            var config = self.pos.config;
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
                $('.screens').css('display', 'none');

                $('#titleSelectCustomer').css('display', 'inline');
                $('#titleSelectSponsor').css('display', 'none');
                $('#cache_left_pane').css('display', 'block');
            });

            this.$('#btn-addcust').click(function(){

                module.unselect_client();

                $('#id-clientscreenwidget').css('display', 'none');
                $('.screens').css('display', 'block');
                //$('.order-container').css('display', 'none');
                //$('#leftpane footer').css('display', 'none');
                //$('#form-client').css('display', 'block');
                $('#titre_form_edit_client').css('display', 'none');
                $('#titre_form_create_client').css('display', 'block');
                //$('#cache-header-cust').css('display', 'block');
                //$('#cache-right-pan').css('display', 'block');
                show_form_client();
            });

            $('#id_salesscreen').css('display', 'none');

            self.$('#cashier-select').change(function(){
                var name = this.value;
                cashier_change(name);
            });

            global_pwd = self.pos.attributes.pwd;

            var pos_config = self.pos.config
            if (pos_config != null){
                posid = pos_config.id;
            }

            get_pos_messages();
        },

        build_widgets: function() {
            var self = this;
            this._super();

            this.clients = new module.ClientScreenWidget(this, {});
            this.clients.prependTo($('.rightpane>.window'));

            this.pack = new module.PackScreenWidget(this, {});
            this.pack.prependTo($('.rightpane>.window'));

            this.formclient = new module.FormClientWidget(this, {});
            this.formclient.replace(this.$('#placeholder-CustFormWidget'));

            this.gotopay = new module.GoToPayWidget(this, {});
            this.gotopay.replace(this.$('#placeholder-GoToPayWidget'));

            this.sales = new module.SalesScreenWidget(this,{});
            this.sales.prependTo($('.rightpane>.window'));

            this.pwd_alert = new module.AlertPwdWidget(this,{});
            this.pwd_alert.replace(this.$('.placeholder-AlertPwdWidget'));

            this.msgs = new module.tgMessageWidget(this, {});
            this.msgs.replace(this.$('.placeholder-MessageWidget'));

            var label_deco = $('#label_deconexion').html();

            // remove old header-button
            this.$('.header-button').remove();

            this.close1_button = new module.HeaderButtonWidget(this,{
                label: label_deco,
                action: function(){ self.close(); },
            });
            this.close1_button.appendTo(this.$('.pos-rightheader'));

            this.client_button = new module.HeaderButtonWidget(this,{
                label: _t('Self-Checkout'),
                action: function(){ self.screen_selector.set_user_mode('client'); },
            });
            this.client_button.appendTo(this.$('.pos-rightheader'));
        },
    });
};

(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;
        tg_pos_enhanced_models(instance,module);    // import tg_pos_enhanced_models/tg_pos_enhanced.js
        tg_pos_enhanced(instance,module);           // import tg_pos_enhanced/tg_pos_enhanced.js

        $('<link rel="stylesheet" href="/tg_pos_enhanced/static/src/css/tg_pos.css"/>').appendTo($("head"))
    }
})()
