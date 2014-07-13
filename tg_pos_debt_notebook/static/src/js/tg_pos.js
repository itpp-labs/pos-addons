function tg_pos_debt_notebook(instance, module){ //module is instance.point_of_sale
    //var module = instance.point_of_sale;

    module.Order = module.Order.extend({
        addPaymentline: function(cashregister) {
            var self = this;
            var journal = cashregister.journal
            if (journal.debt && ! this.get('partner_id')){
                return;
            }

            var paymentLines = this.get('paymentLines');
            var newPaymentline = new module.Paymentline({},{cashregister:cashregister});

            if(journal.type !== 'cash'){
                var val;
                if (journal.debt)
                    val = -this.getChange() || 0
                else
                    val = this.getDueLeft()
                newPaymentline.set_amount( val );
            }
            paymentLines.add(newPaymentline);
            this.selectPaymentline(newPaymentline);
        }

    })
    module.PaymentScreenWidget.include({
        show: function(){
            var self=this;
            this._super();
            var order = this.pos.get('selectedOrder');
            if (!order.get('partner_id')){
                $('.paypad-button.debt').removeClass('disabled').addClass('disabled')
                this.select_partner_button = this.add_action_button({
                    label: 'Find customer',
                    icon: '/tg_pos_enhanced/static/src/img/find_client.png',
                    click: function(){
                        self.back_button.click_action();
                        self.pos_widget.$('#btn-findcust').click();
                        order.set('payment_after_select_client', 1)
                    }
                });
            }else{
                $('.paypad-button.debt').removeClass('disabled')
            }


        },
        updatePaymentSummary:function(){
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

            var emptyOrder = false;
            var onlyPayback = false;
            if(currentOrder.selected_orderline === undefined ){
                //remaining = 1;  // What is this ? (Maybe it means that there are no prouducts at list)
                emptyOrder = true;
                if (currentOrder.get('partner_id')) {
                    var hasPositiveAmount = false;
                    var hasDebt = false;
                    currentOrder.get('paymentLines').each((function(paymentLine){
                        var isDebt = paymentLine.cashregister.journal.debt;
                        if (!isDebt && (paymentLine.get_amount() > 0.000001))
                            hasPositiveAmount = true;
                        if (isDebt)
                            hasDebt = true;
                    }), false)
                    onlyPayback = hasPositiveAmount && hasDebt;
                }
            }

            if(this.pos_widget.action_bar){
                this.pos_widget.action_bar.set_button_disabled('validation', (sousTotalApayer < 0 || remaining > 0.000001 || emptyOrder && !onlyPayback) );
            }


        }
    });

    (function(){
        _super = module.unselect_client;
        module.unselect_client = function(){
            _super();
            $('#img_current_debt').attr('src', '/tg_pos_enhanced/static/src/img/disabled_montant_cumule.png')
            $('#current_debt').html('')
        }
    })()

    var select_client = function(cid, cname, cfname, cmontantcumule, cdebt){
        this._super(cid, cname, cfname, cmontantcumule);

        $('#current_debt').removeClass('positive negative')
        if (cdebt > 0){
            // it's credit. Customer has to pay
            $('#current_debt').addClass('positive');
        }else{
            // it's debit. Customer is overpay
            $('#current_debt').addClass('negative');
        }

        var debt = Number(cdebt).toFixed(2);
        $('#current_debt').html(debt);
        $('#img_current_debt').attr('src', '/tg_pos_enhanced/static/src/img/montant_cumule.png')

        var order = this.pos.get('selectedOrder');
        if (order.get('payment_after_select_client')){
            this.pos_widget.$('#gotopay button').click()
        }
    }

    module.ClientsLettersWidget.include({
        select_client: select_client
    })
    module.ClientScreenWidget.include({
        select_client: select_client
    })
    // copy past
    var fetch = function(model, fields, domain, ctx){
        return new instance.web.Model(model).query(fields).filter(domain).context(ctx).all();
    };
    var QWeb = instance.web.qweb;

    //copy-past function and add current_debt sup
    var get_clients = function(letter){
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
             'debt',
             'pos_comment'],
            l_filter
        )
                .then(function(clients){
                    for(var i = 0, len = clients.length; i < len; i++){
                        clients_list[i] = [];
                        clients_list[i]['id'] = clients[i].id;
                        clients_list[i]['montantCumule'] = clients[i].montantCumule;
                        clients_list[i]['debt'] = clients[i].debt;
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
                                c_current_debt:clients_list[i].debt,
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
                                var s_current_debt = $('.c-current-debt', this).html().trim();

                                self.select_client(s_id, s_name, s_fname, s_montant_cumule, s_current_debt);
                            });
                        }

                    } else{
                        var no_client = QWeb.render('NoClientWidget',{});
                        $(no_client).appendTo($('#client-list'));
                    }

                    $('#nb_customers').html(clients_list.length);
                });
    }
    module.FormClientWidget.include({
        get_clients:get_clients
    })
    module.ClientScreenWidget.include({
        get_clients:get_clients
    })
    module.ClientsLettersWidget.include({
        get_clients:get_clients
    })

}



(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;
        tg_pos_debt_notebook(instance, module);
    }

    $('<link rel="stylesheet" href="/tg_pos_debt_notebook/static/src/css/tg_pos.css"/>').appendTo($("head"))

})()
