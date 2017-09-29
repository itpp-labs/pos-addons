odoo.define('pos_invoices', function (require) {
'use_strict';

var core = require('web.core');
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var PosDb = require('point_of_sale.DB');
var ProductScreenWidget = require('point_of_sale.screens').ProductScreenWidget;
var ClientListScreenWidget = require('point_of_sale.screens').ClientListScreenWidget;
var PaymentScreenWidget = require('point_of_sale.screens').PaymentScreenWidget;
var ReceiptScreenWidget = require('point_of_sale.screens').ReceiptScreenWidget;
var utils = require('web.utils');

var Model = require('web.Model');

var QWeb = core.qweb;
var _t = core._t;
var round_pr = utils.round_precision;


var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({
    initialize: function (session, attributes) {
        var self = this;
        this.models.push(
        {
            model: 'sale.order',
            fields: ['name', 'partner_id', 'date_order', 'user_id',
            'amount_total', 'order_line', 'invoice_status'],
            domain:[['invoice_status', '!=', 'invoiced'], ['state', '=', 'sale']],
            loaded: function (self, sale_orders) {
                self.prepare_so_data(sale_orders);
                self.sale_orders = sale_orders;
                self.db.add_sale_orders(sale_orders);
            }
        },{
            model: 'account.invoice',
            fields: ['name', 'partner_id', 'date_invoice','number', 'date_due',
            'amount_total', 'user_id', 'residual', 'state', 'amount_untaxed', 'amount_tax'],
            domain: [['state', 'in', ['open', 'draft']],
            ['type','=', 'out_invoice']],
            loaded: function (self, invoices) {
                self.prepare_invoices_data(invoices);
                self.invoices = invoices;
                self.db.add_invoices(invoices);
            }
        });
        return _super_posmodel.initialize.apply(this, arguments);
    },

    prepare_invoices_data: function (data) {
        _.each(data, function (item) {
            for (var property in item) {
                if (item.hasOwnProperty(property)) {
                    if (item[property] === false) {
                        item[property] = ' ';
                    }
                }
            }
            var stateAttr = item.state;
            item.state = stateAttr.charAt(0).toUpperCase() + stateAttr.slice(1);
        });
    },

    prepare_so_data: function (data) {
        _.each(data, function (item) {
            switch (item.invoice_status) {
                case 'to invoice':
                    item.invoice_status = 'To invoice';
                    break;
                case 'no':
                    item.invoice_status = 'Nothing to invoice';
                    break;
            }
        });
    },

    update_or_fetch_invoice: function(id) {
        var def = $.Deferred();
        var self = this;
        var fields = _.find(this.models,function(model){ return model.model === 'account.invoice'; }).fields;
        new Model('account.invoice').query(fields).
            filter([['id', '=', id]]).
            all().then(function(res) {
                self.prepare_invoices_data(res);
                self.db.update_invoice_db(res[0]);
                self.selected_invoice = false;
                def.resolve();
            });
        return def.promise();
    }
});

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
    export_as_JSON: function () {
        if (this.invoice_to_pay) {
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.invoice_to_pay = this.invoice_to_pay;
            return data;
        }
        return _super_order.export_as_JSON.apply(this, arguments);
    }
});

PosDb.include({
    init: function (options) {
        this._super(options);

        this.sale_orders = [];
        this.sale_orders_by_id = {};
        this.sale_orders_search_string = '';

        this.invoices = [];
        this.invoices_by_id = {};
        this.invoices_search_string = '';
    },

    add_sale_orders: function (sale_orders) {
        var self = this;
        _.each(sale_orders, function (order) {
            self.sale_orders.push(order);
            self.sale_orders_by_id[order.id] = order;
            self.sale_orders_search_string += self._sale_order_search_string(order);
        });
    },

    _sale_order_search_string: function(sale_order){
        var str =  sale_order.name;
        if(sale_order.date_order){
            str += '|' + sale_order.date_order;
        }
        if(sale_order.partner_id[1]){
            str += '|' + sale_order.partner_id[1];
        }
        if(sale_order.user_id[1]){
            str += '|' + sale_order.user_id[1];
        }
        if(sale_order.amount_total){
            str += '|' + sale_order.amount_total;
        }
        str = '' + sale_order.id + ':' + str.replace(':','') + '\n';
        return str;
    },

    search_sale_orders: function (query) {
        try {
            query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g,'.');
            query = query.replace(/ /g,'.+');
            var re = RegExp("([0-9]+):.*?"+query,"gi");
        }catch(e){
            return [];
        }
        var results = [];
        for(var i = 0; i < this.limit; i++){
            var r = re.exec(this.sale_orders_search_string);
            if(r){
                var id = Number(r[1]);
                results.push(this.get_sale_order_by_id(id));
            }else{
                break;
            }
        }
        return results.filter(function (res) {
            return typeof res === 'object';
        });
    },

    get_sale_order_by_id: function (id) {
        return this.sale_orders_by_id[id];
    },

    update_so_db: function (updated_so) {
        for (var i=0; i<this.sale_orders.length; i++) {
            if (this.sale_orders[i].id === updated_so.id) {
                this.sale_orders.splice(i, 1);
            }
            delete this.sale_orders_by_id[updated_so.id];
        }
    },

    add_invoices: function (invoices) {
        var self = this;
        _.each(invoices, function (invoice) {
            self.invoices.push(invoice);
            self.invoices_by_id[invoice.id] = invoice;
            self.invoices_search_string += self._invoices_search_string(invoice);
        });
    },

    update_invoice_db: function (updated_invoice) {
        for (var i=0; i<this.invoices.length; i++) {
            if (this.invoices[i].id === updated_invoice.id) {
                this.invoices.splice(i, 1);
            }
        }
        if (updated_invoice.state === "Draft" || updated_invoice.state === "Open") {
            this.invoices.unshift(updated_invoice);
            this.invoices_by_id[updated_invoice.id] = updated_invoice;
        } else {
            delete this.invoices_by_id[updated_invoice.id];
        }  
    },

    _invoices_search_string: function (invoice) {
        var str = invoice.partner_id[1];
        if (invoice.number) {
            str += '|' + invoice.number;
        }
        if (invoice.date_invoice) {
            str += '|' + invoice.date_invoice;
        }
        if (invoice.date_due) {
            str += '|' + invoice.date_due;
        }
        if (invoice.user_id[1]) {
            str += '|' + invoice.user_id[1];
        }
        if (invoice.amount_total) {
            str += '|' + invoice.amount_total;
        }
        str = '' + invoice.id + ':' + str.replace(':','') + '\n';
        return str;
    },

    search_invoices: function (query) {
        try {
            query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g,'.');
            query = query.replace(/ /g,'.+');
            var re = RegExp("([0-9]+):.*?"+query,"gi");
        }catch(e){
            return [];
        }
        var results = [];
        for(var i = 0; i < this.limit; i++){
            var r = re.exec(this.invoices_search_string);
            if(r){
                var id = Number(r[1]);
                results.push(this.get_invoice_by_id(id));
            }else{
                break;
            }
        }
        return results.filter(function (res) {
            return typeof res === 'object';
        });
    },

    get_invoice_by_id: function (id) {
        return this.invoices_by_id[id];
    }
});

ProductScreenWidget.include({
    show: function () {
        var self = this;
        this._super();
        this.$('.fetch-orders').click(function () {
            self.gui.show_screen('sale_orders_list');
        });
        this.$('.fetch-invoices').click(function () {
            self.gui.show_screen('invoices_list');
        });
    }
});

var InvoicesAndOrdersBaseWidget = ClientListScreenWidget.extend({
    show: function(){
        var self = this;
        this._super();

        this.renderElement();
        this.details_visible = false;
        this.old_client = this.pos.get_order().get_client();

        this.$('.back').click(function(){
            self.gui.back();
        });

        this.$('.next').click(function(e){
            e.preventDefault;
            self.handle_next();
            // self.save_changes();
            // self.gui.back();
        });

        this.render_data(this.data);

        this.$('.client-list-contents').delegate(this.$listEl,'click',function(event){
            self.select_line(event,$(this),parseInt($(this).data('id')));
        });

        // this.reload_partners();

        var search_timeout = null;

        if(this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard){
            this.chrome.widget.keyboard.connect(this.$('.searchbox input'));
        }

        this.$('.searchbox input').on('keypress',function(event){
            clearTimeout(search_timeout);

            var query = this.value;

            search_timeout = setTimeout(function(){
                self._search(query);
            },70);
        });

        this.$('.searchbox .search-clear').click(function(){
            self._clear_search();
        });
    },

    render_data: function (data) {
        var contents = this.$el[0].querySelector('.client-list-contents');
        contents.innerHTML = "";
        for(var i = 0, len = Math.min(data.length,1000); i < len; i++){
            var item = data[i];
                var item_html = QWeb.render(this.itemTemplate,{widget: this, item:data[i]});
                var item_line = document.createElement('tbody');
                item_line.innerHTML = item_html;
                item_line = item_line.childNodes[1];
            contents.appendChild(item_line);
        }
    },

});


var SaleOrdersWidget = InvoicesAndOrdersBaseWidget.extend({
    template: 'SaleOrdersWidget',
    init: function () {
        this._super.apply(this, arguments);
        this.data = this.pos.db.sale_orders;
        this.$listEl = '.sale-order';
        this.itemTemplate = 'SaleOrder';
        this.selected_SO = false;
    },

    show: function () {
        var self = this;
        this._super.apply(this, arguments);
        this.$('.back').unbind('click');
        this.$('.back').click(function () {
            self.gui.show_screen('products');
        });
    },

    select_line: function(event,$line,id){
        var sale_order = this.pos.db.get_sale_order_by_id(id);
        this.$('.client-list .lowlight').removeClass('lowlight');
        if ( $line.hasClass('highlight') ){
            this.selected_SO = false;
            $line.removeClass('highlight');
            $line.addClass('lowlight');
        }else{
            this.$('.client-list .highlight').removeClass('highlight');
            $line.addClass('highlight');
            this.selected_SO = sale_order;
        }
        this.toggle_save_button(this.selected_SO);
    },

    toggle_save_button: function (selected_invoice) {
        var $button = this.$('.button.next');

        if (selected_invoice) {
            $button.removeClass('oe_hidden');
        } else {
            $button.addClass('oe_hidden');
        }
    },

    handle_next: function () {
        var self = this;
        if (this.selected_SO) {
            this.create_invoice(this.selected_SO);
        } else {
            this.gui.show_popup('error',{
                'title': _t('No invoice'),
                'body':  _t('There must be invoice selected.'),
            });
            return false;
        }
    },

    create_invoice: function (sale_order) {
        var self = this;
        new Model('pos.order').call('process_invoices_creation', [sale_order.id])
            .then(function (res) {
                self.pos.update_or_fetch_invoice(res)
                    .then(function () {
                        self.pos.db.update_so_db(sale_order);
                        self.gui.show_screen('invoices_list');
                    });
            }, function (err, event) {   
                self.gui.show_popup('error', {
                    'title': _t(err.message),
                    'body': _t(err.data.arguments[0])
                });
                console.log(err);
                event.preventDefault();
            });   
    },

    _search: function (query) {
        var sale_orders;
        if(query){
            sale_orders = this.pos.db.search_sale_orders(query);
            this.render_data(sale_orders);
        }else{
            sale_orders = this.pos.db.sale_orders;
            this.render_data(sale_orders);
        }
    },
    _clear_search: function(){
        var sale_orders = this.pos.db.sale_orders;
        this.render_data(sale_orders);
        this.$('.searchbox input')[0].value = '';
        this.$('.searchbox input').focus();
    },
});

gui.define_screen({name:'sale_orders_list', widget: SaleOrdersWidget});


var InvoicesWidget = InvoicesAndOrdersBaseWidget.extend({
    template: 'InvoicesWidget',
    init: function () {
        this._super.apply(this, arguments);
        this.data = this.pos.db.invoices;
        this.$listEl = '.invoice';
        this.itemTemplate = 'Invoice';
        this.selected_invoice = false;

    },

    select_line: function(event,$line,id){
        var invoice = this.pos.db.get_invoice_by_id(id);
        this.$('.client-list .lowlight').removeClass('lowlight');
        if ($line.hasClass('highlight')){
            this.selected_invoice = false;
            $line.removeClass('highlight');
            $line.addClass('lowlight');
        }else{
            this.$('.client-list .highlight').removeClass('highlight');
            $line.addClass('highlight');
            this.selected_invoice = invoice;
        }
        this.toggle_save_button(this.selected_invoice);
    },

    toggle_save_button: function (selected_invoice) {
        var $button = this.$('.button.next');

        if (selected_invoice) {
            switch (selected_invoice.state) {
                case "Draft":
                    $button.text('Validate');
                    break;
                case "Open":
                    $button.text('Register payment');
            }
        }

        if (selected_invoice) {
            $button.removeClass('oe_hidden');
        } else {
            $button.addClass('oe_hidden');

        }
    },

     _search: function (query) {
        var invoices;
        if(query){
            invoices = this.pos.db.search_invoices(query);
            this.render_data(invoices);
        }else{
            invoices = this.pos.db.invoices;
            this.render_data(invoices);
        }
    },

     _clear_search: function(){
        var invoices = this.pos.db.invoices;
        this.render_data(invoices);
        this.$('.searchbox input')[0].value = '';
        this.$('.searchbox input').focus();
    },

    handle_next: function () {
        var self = this;
        if (this.selected_invoice) {
            this.pos.selected_invoice = this.selected_invoice;
            switch (this.selected_invoice.state) {
                case "Draft":                    
                    this.validate_invoice().
                        then(function() {
                            self.pos.update_or_fetch_invoice(self.selected_invoice.id).
                            then(function() {
                                self.render_data(self.pos.db.invoices);
                                self.toggle_save_button();
                            });
                            
                        }).fail(function() {
                            this.gui.show_popup('error',{
                                'title': _t('Error'),
                                'body':  _t('Can\'t validate selected invoice.'),
                            });
                        });
                    break;
                case "Open":
                    this.gui.show_screen('invoice_payment');
            }
        } else {
            this.gui.show_popup('error',{
                'title': _t('No invoice'),
                'body':  _t('There must be invoice selected.'),
            });
            return false;
        }
    },

    validate_invoice: function () {
        var result = $.Deferred();
        new Model('account.invoice').
            call('action_invoice_open', [this.selected_invoice.id]).
            then(function(res) {
                if (res) {
                    result.resolve();
                } else {
                    result.reject();
                }
            });
        return result.promise();
        }
});

gui.define_screen({name:'invoices_list', widget: InvoicesWidget});

var InvoicePayment = PaymentScreenWidget.extend({
    template: 'InvoicePaymentScreenWidget',
    init: function () {
        this._super.apply(this, arguments);
    },
    show: function () {
        this._super.apply(this, arguments);
    },

    get_invoice_residual: function () {
        if (this.pos.selected_invoice) {
            return this.pos.selected_invoice.residual;
        }
        return 0;
    },

    render_paymentlines: function() {
        var self  = this;
        var order = this.pos.get_order();
        if (!order) {
            return;
        }
        if (!this.pos.selected_invoice) {
            return;
        }
        order.invoice_to_pay = this.pos.selected_invoice;

        order.invoice_to_pay.get_due = function(paymentline) {
            total = self.pos.selected_invoice.residual;
            if (!paymentline) {
                var due = total - order.get_total_paid();
            } else {
                var due = total;
                var lines = order.paymentlines.models;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] === paymentline) {
                        break;
                    } else {
                        due -= lines[i].get_amount();
                    }
                }
            }
            return round_pr(Math.max(0,due), self.pos.currency.rounding);

        }

        order.invoice_to_pay.get_change = function(paymentline) {
            var due = self.pos.selected_invoice.residual;
            if (!paymentline) {
                var change = -due + order.get_total_paid();
            } else {
                var change = -due; 
                var lines  = order.paymentlines.models;
                for (var i = 0; i < lines.length; i++) {
                    change += lines[i].get_amount();
                    if (lines[i] === paymentline) {
                        break;
                    }
                }
            }
            return round_pr(Math.max(0,change), self.pos.currency.rounding);
        }

        order.invoice_to_pay.get_subtotal = function () {
            var tax = self.pos.selected_invoice.amount_tax;
            var due = self.pos.selected_invoice.residual;
            return due - tax;
            // return due - (due/100*tax)
        }

        var lines = order.get_paymentlines();
        var due   = order.invoice_to_pay.amount_due;
        var extradue = 0;
        // if (due && lines.length  && due !== order.get_due(lines[lines.length-1])) {
        //     extradue = due;
        // }

        this.$('.paymentlines-container').empty();
        var lines = $(QWeb.render('InvoicePaymentScreen-Paymentlines', { 
            widget: this, 
            order: order,
            paymentlines: lines,
            extradue: extradue,
        }));

        lines.on('click','.delete-button',function(){
            self.click_delete_paymentline($(this).data('cid'));
        });

        lines.on('click','.paymentline',function(){
            self.click_paymentline($(this).data('cid'));
        });
            
        lines.appendTo(this.$('.paymentlines-container'));
    },

    finalize_validation: function() {
        var self = this;
        var order = this.pos.get_order();
        order.invoice_to_pay = this.pos.selected_invoice;

        if (order.is_paid_with_cash() && this.pos.config.iface_cashdrawer) { 
            this.pos.proxy.open_cashbox();
        }

        order.initialize_validation_date();

        if (order.is_to_invoice()) {
            var invoiced = this.pos.push_and_invoice_order(order);
            this.invoicing = true;

            invoiced.fail(function(error){
                self.invoicing = false;
                if (error.message === 'Missing Customer') {
                    self.gui.show_popup('confirm',{
                        'title': _t('Please select the Customer'),
                        'body': _t('You need to select the customer before you can invoice an order.'),
                        confirm: function(){
                            self.gui.show_screen('clientlist');
                        },
                    });
                } else if (error.code < 0) {        // XmlHttpRequest Errors
                    self.gui.show_popup('error',{
                        'title': _t('The order could not be sent'),
                        'body': _t('Check your internet connection and try again.'),
                    });
                } else if (error.code === 200) {    // OpenERP Server Errors
                    self.gui.show_popup('error-traceback',{
                        'title': error.data.message || _t("Server Error"),
                        'body': error.data.debug || _t('The server encountered an error while receiving your order.'),
                    });
                } else {                            // ???
                    self.gui.show_popup('error',{
                        'title': _t("Unknown Error"),
                        'body':  _t("The order could not be sent to the server due to an unknown error"),
                    });
                }
            });

            invoiced.done(function(){
                self.invoicing = false;
                self.gui.show_screen('receipt');
            });
        } else {
            this.pos.push_order(order).then(function() {
                self.pos.update_or_fetch_invoice(self.pos.selected_invoice.id);
                self.gui.show_screen('invoice_receipt');
            });   
        }
    },

    validate_order: function () {
        this.finalize_validation();
    }

});

gui.define_screen({name:'invoice_payment', widget: InvoicePayment});

var InvoiceReceiptScreenWidget = ReceiptScreenWidget.extend({
    template: 'InvoiceReceiptScreenWidget',
    render_receipt: function() {
        var order = this.pos.get_order();
        this.$('.pos-receipt-container').html(QWeb.render('PosInvoiceTicket',{
                widget:this,
                order: order,
                receipt: order.export_for_printing(),
                orderlines: order.get_orderlines(),
                paymentlines: order.get_paymentlines(),
            }));
    },
});

gui.define_screen({name:'invoice_receipt', widget: InvoiceReceiptScreenWidget});


});
