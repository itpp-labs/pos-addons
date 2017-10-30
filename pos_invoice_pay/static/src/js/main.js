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
var bus = require('bus.bus').bus;

var Model = require('web.Model');

var QWeb = core.qweb;
var _t = core._t;
var round_pr = utils.round_precision;


var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({
    initialize: function (session, attributes) {
        var self = this;
        this.bus = bus;
        this.prepare_bus();
        this.models.push(
        {
            model: 'sale.order',
            fields: ['name', 'partner_id', 'date_order', 'user_id',
            'amount_total', 'order_line', 'invoice_status'],
            domain:[['invoice_status', '=', 'to invoice'], ['state', '=', 'sale']],
            loaded: function (self, sale_orders) {
                self.prepare_so_data(sale_orders);
                self.sale_orders = sale_orders;
                self.db.add_sale_orders(sale_orders);

                var so_ids = _.pluck(sale_orders, 'id');

                self.get_sale_order_lines(so_ids);
            }
        },{
            model: 'account.invoice',
            fields: ['name', 'partner_id', 'date_invoice','number', 'date_due', 'origin',
            'amount_total', 'user_id', 'residual', 'state', 'amount_untaxed', 'amount_tax'],
            domain: [['state', '=', 'open'],
            ['type','=', 'out_invoice']],
            loaded: function (self, invoices) {
                self.prepare_invoices_data(invoices);
                self.invoices = invoices;
                self.db.add_invoices(invoices);

                var invoices_ids = _.pluck(invoices, 'id');

                self.get_invoice_lines(invoices_ids);
            }
        });
        return _super_posmodel.initialize.apply(this, arguments);
    },

    get_lines: function (ids, model_name, method_name) {
        return new Model(model_name).call(method_name, [ids]);
    },

    get_sale_order_lines: function (ids) {
        var def = $.Deferred();
        var self = this;
        this.get_lines(ids, 'sale.order', 'get_order_lines_for_pos').
            then(function (res) {
                for (var i = 0, max = res.length; i < max; i++) {
                    var so_id = res[i].order_id;
                    var so = self.db.sale_orders_by_id[so_id];
                    if (!so) {
                        return;
                    }
                    if (!Object.prototype.hasOwnProperty.call(so, 'lines')) {
                        so.lines = [];
                    }
                    so.lines.push(res[i]);
                    def.resolve();
                }
            }, function (err) {
                console.log(err);
            });
        return def.promise();
    },

    get_invoice_lines: function (data) {
        var def = $.Deferred();
        var self = this;
        this.get_lines(data, 'account.invoice', 'get_invoice_lines_for_pos').
            then(function (res) {
                _.each(res, function(res) {
                    var inv_id = res.invoice_id;
                    var inv = self.db.invoices_by_id[inv_id];
                    if (!inv) {
                        return;
                    }
                    inv.lines = [];
                });
                for (var i = 0, max = res.length; i < max; i++) {
                    var inv_id = res[i].invoice_id;
                    var inv = self.db.invoices_by_id[inv_id];

                    if (!inv) {
                        return;
                    }

                    if (!Object.prototype.hasOwnProperty.call(inv, 'lines')) {
                        inv.lines = [];
                    }
                    inv.lines.push(res[i]);
                    def.resolve();
                }
            });
        return def.promise();
    },

    prepare_bus: function () {
        var self = this;
        new Model('pos.order').call('send_longpolling_data', []).
        then(function (res) {
            var invoices_channel = JSON.stringify([res.dbname, 'account.invoice', res.uid.toString()]);
            var so_channel = JSON.stringify([res.dbname, 'sale.order', res.uid.toString()]);
            self.bus.add_channel(invoices_channel);
            self.bus.add_channel(so_channel);
            self.bus.on("notification", self, self.on_notification);
            self.bus.start_polling();
        });
    },

    on_notification: function(notification) {
        var invoices_to_update = [];
        var sale_orders_to_update = [];
        for (var i = 0; i < notification.length; i++) {
            var channel = notification[i][0];
            var message = notification[i][1];
            if (_.isString(channel)) {
                channel = JSON.parse(channel);
            }
            if (Array.isArray(channel) && channel[1] === 'account.invoice') {
                invoices_to_update.push(message);
            }
            if (Array.isArray(channel) && channel[1] === 'sale.order') {
                sale_orders_to_update.push(message);
            }
        }
        if (invoices_to_update.length > 0) {
            this.update_invoices_from_poll(_.unique(invoices_to_update));
        }
        if (sale_orders_to_update.length > 0) {
            this.update_sale_orders_from_poll(_.unique(sale_orders_to_update));
        }
    },

    update_invoices_from_poll: function (ids) {
        var self = this;
        _.each(ids, function (id) {
            self.update_or_fetch_invoice(id).then(function () {
                self.gui.current_screen.show();
            });
        });
    },

    update_sale_orders_from_poll : function (ids) {
        var self = this;
        _.each(ids, function (id) {
            self.update_or_fetch_sale_order(id).then(function () {
                self.gui.current_screen.show();
            });
        });
    },

    prepare_invoices_data: function (data) {
        _.each(data, function (item) {
            for (var property in item) {
                if (Object.prototype.hasOwnProperty.call(item, property)) {
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

    get_res: function (model_name, id) {
        var fields = _.find(this.models, function (model){
            return model.model === model_name;
        }).fields;
        return new Model(model_name).
            query(fields).
            filter([['id', '=', id]]).
            all();
    },

    update_or_fetch_invoice: function (id) {
        var self = this;
        var def = $.Deferred();
        this.get_res('account.invoice', id).
            then(function (res) {
                self.prepare_invoices_data(res);
                self.db.update_invoice_db(res[0]);
                self.get_invoice_lines([res[0].id]).
                    then(function() {
                        def.resolve(id);
                    });
            });
        return def.promise();
    },

    update_or_fetch_sale_order: function (id) {
        var def = $.Deferred();
        var self = this;
            this.get_res('sale.order', id).
                then(function (res) {
                    self.prepare_so_data(res);
                    self.db.update_so_db(res[0]);
                    self.get_sale_order_lines([res[0].id]).
                    then(function() {
                        def.resolve(id);
                    });
            });
        return def.promise();
    },

    validate_invoice: function (id) {
        var result = $.Deferred();
        new Model('account.invoice').
            call('action_invoice_open', [id]).
            then(function(res) {
                if (res) {
                    result.resolve(id);
                } else {
                    result.reject();
                }
            });
        return result.promise();
    },

    get_invoices_to_render: function (invoices) {
        var self = this;
        var orders_to_mute = _.filter(this.db.get_orders(), function(order) {
            return order.data.invoice_to_pay;
        });

        var muted_invoices_ids = [];
        if(orders_to_mute) {
            for(var i=0; orders_to_mute.length>i; i++) {
                var order = orders_to_mute[i];
                var id = order.data.invoice_to_pay.id;
                muted_invoices_ids.push(id);
            }
        }

        if (muted_invoices_ids) {
            invoices = _.filter(invoices, function (inv) {
                return !muted_invoices_ids.includes(inv.id);
            });
        }

        var client = this.get_client();
        if (client) {
            invoices = _.filter(invoices, function(inv) {
                return inv.partner_id[0] === client.id;
            });
            return invoices;
        }

        invoices = _.filter(invoices, function (inv) {
            return inv.state === 'Open';
        });

        return invoices;
    },

    get_sale_order_to_render: function (sale_orders) {
        var client = this.get_client();
        if (client) {
            sale_orders = _.filter(sale_orders, function(so) {
                return so.partner_id[0] === client.id;
            });
            return sale_orders;
        }
        return sale_orders;
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

    update_so_search_string: function (sale_orders) {
        var self = this;
        self.sale_orders_search_string = '';
        _.each(sale_orders, function(order) {
            self.sale_orders_search_string += self._sale_order_search_string(order);
        });
    },

    update_invoices_search_string: function (invoices) {
        var self = this;
        self.invoices_search_string = '';
        _.each(invoices, function(inv) {
            self.invoices_search_string += self._invoice_search_string(inv);
        });
    },

    _sale_order_search_string: function (sale_order) {
        var str = sale_order.name;
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
        str = '' + String(sale_order.id) + ':' + str.replace(':','') + '\n';
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
        for (var i = 0; i< this.sale_orders.length; i++) {
            if (this.sale_orders[i].id === updated_so.id) {
                this.sale_orders.splice(i, 1);
            } 
        }
        delete this.sale_orders_by_id[updated_so.id];
        if (updated_so.invoice_status === 'To invoice') {
            this.sale_orders.unshift(updated_so);
            this.sale_orders_by_id[updated_so.id] = updated_so;
        }
        this.update_so_search_string(this.sale_orders);
    },

    add_invoices: function (invoices) {
        var self = this;
        _.each(invoices, function (invoice) {
            self.invoices.push(invoice);
            self.invoices_by_id[invoice.id] = invoice;
            self.invoices_search_string += self._invoice_search_string(invoice);
        });
    },

    update_invoice_db: function (updated_invoice) {
        for (var i = 0; i < this.invoices.length; i++) {
            if (this.invoices[i].id === updated_invoice.id) {
                this.invoices.splice(i, 1);
                continue;
            }
        }
        if (updated_invoice.state === "Draft" || updated_invoice.state === "Open") {
            this.invoices.unshift(updated_invoice);
            this.invoices_by_id[updated_invoice.id] = updated_invoice;
        } else {
            delete this.invoices_by_id[updated_invoice.id];
        }
        this.update_invoices_search_string(this.invoices);
    },

    _invoice_search_string: function (invoice) {
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
    show: function () {
        var self = this;
        this._super();

        this.renderElement();
        this.details_visible = false;
        this.old_client = this.pos.get_order().get_client();

        this.$('.next').click(function(e){
            e.preventDefault();
            self.handle_next();
        });

        this.render_data(this.get_data());

        this.$('.client-list-contents').delegate(this.$listEl,'click',function(event){
            self.select_line(event,$(this),parseInt($(this).data('id')));
        });

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

                var $tr = document.createElement('tr');
                if (data[i].lines) {
                    var $td = document.createElement('td');
                    $td.setAttribute("colspan", this.num_columns);

                    $tr.classList.add('line-element-hidden');

                    var $table = this.render_lines_table(data[i].lines);

                    $td.appendChild($table);
                    $tr.appendChild($td);
                }
                item_line.innerHTML = item_html;
                item_line = item_line.childNodes[1];

            contents.appendChild(item_line);
            contents.appendChild($tr);

        }
    },

    render_lines_table: function (data_lines) {
        var $table = document.createElement('table'),
        $header = this.render_header(),
        $tableData = this.render_product_lines(data_lines);

        $table.classList.add('lines-table');

        $table.appendChild($header);
        $table.appendChild($tableData);
        return $table;
    },

    render_header: function () {
        var $header = document.createElement('thead');
        $header.innerHTML = QWeb.render(this.linesHeaderTemplate);
        return $header;
    },

    render_product_lines: function (data_lines) {
        var $body = document.createElement('tbody'),
        lines = '',
        line_html = '';
        for(var i = 0, max = data_lines.length; i < max; i++) {
            line_html = QWeb.render(this.lineTemplate, {widget: this, line:data_lines[i]});
            lines += line_html;
        }
        $body.innerHTML = lines;
        return $body;
    },

});


var SaleOrdersWidget = InvoicesAndOrdersBaseWidget.extend({
    template: 'SaleOrdersWidget',
    init: function () {
        this._super.apply(this, arguments);
        this.$listEl = '.sale-order';

        this.itemTemplate = 'SaleOrder';
        this.linesHeaderTemplate = 'SaleOrderLinesHeader';
        this.lineTemplate = 'SaleOrderLine';
        this.num_columns = 6;

        this.selected_SO = false;
    },

    show: function () {
        var self = this;
        this._super.apply(this, arguments);
        this.$('.back').click(function () {
            self.gui.show_screen('products');
        });
    },
    get_data: function () {
        return this.pos.get_sale_order_to_render(this.pos.db.sale_orders);
    },

    select_line: function (event,$line,id) {
        var sale_order = this.pos.db.get_sale_order_by_id(id);
        this.$('.client-list .lowlight').removeClass('lowlight');
        if ( $line.hasClass('highlight') ){
            this.selected_SO = false;
            $line.removeClass('highlight');
            $line.addClass('lowlight');
            $line.next().addClass('line-element-hidden');

        }else{
            this.$('.client-list .highlight').removeClass('highlight');
            $line.addClass('highlight');
            this.selected_SO = sale_order;
            $line.next().removeClass('line-element-hidden');
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
        new Model('pos.order').call('process_invoices_creation', [sale_order.id]).
            then(function (res) {
                self.pos.update_or_fetch_invoice(res).
                    then(function (res) {
                        self.render_data(self.pos.db.sale_orders);
                        self.pos.validate_invoice(res).then(function (res) {
                            self.pos.update_or_fetch_invoice(res).then(function(res) {
                                self.pos.selected_invoice = self.pos.db.get_invoice_by_id(res);
                                self.pos.gui.screen_instances.invoice_payment.render_paymentlines();
                                self.gui.show_screen('invoice_payment');
                            });
                        });
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
        var sale_orders = [];
        if(query){
            sale_orders = this.pos.db.search_sale_orders(query);
            sale_orders = this.pos.get_sale_order_to_render(sale_orders);
            this.render_data(sale_orders);
        }else{
            sale_orders = this.pos.db.sale_orders;
            sale_orders = this.pos.get_sale_order_to_render(sale_orders);
            this.render_data(sale_orders);
        }
    },
    _clear_search: function () {
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
        this.$listEl = '.invoice';

        this.itemTemplate = 'Invoice';
        this.linesHeaderTemplate = 'InvoiceLinesHeader';
        this.lineTemplate = 'InvoiceLine';
        this.num_columns = 8;

        this.selected_invoice = false;

    },
     get_data: function () {
        return this.pos.get_invoices_to_render(this.pos.db.invoices);
     },

    show: function () {
        var self = this;
        this._super.apply(this, arguments);
        this.$('.back').click(function () {
            self.gui.back();
        });
    },

    select_line: function (event,$line,id) {
        var invoice = this.pos.db.get_invoice_by_id(id);
        this.$('.client-list .lowlight').removeClass('lowlight');
        if ($line.hasClass('highlight')){
            this.selected_invoice = false;
            $line.removeClass('highlight');
            $line.addClass('lowlight');
            $line.next().addClass('line-element-hidden');

        }else{
            this.$('.client-list .highlight').removeClass('highlight');
            $line.addClass('highlight');
            this.selected_invoice = invoice;
            $line.next().removeClass('line-element-hidden');

        }
        this.toggle_save_button(this.selected_invoice);
    },

    toggle_save_button: function (selected_invoice) {
        var $button = this.$('.button.next');
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
            invoices = this.pos.get_invoices_to_render(invoices);
            this.render_data(invoices);
        }else{
            invoices = this.pos.db.invoices;
            invoices = this.pos.get_invoices_to_render(invoices);
            this.render_data(invoices);
        }
    },

     _clear_search: function () {
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
                this.pos.validate_invoice(this.selected_invoice.id).
                    then(function (id) {
                        self.pos.update_or_fetch_invoice(id).
                        then(function() {
                            self.render_data(self.pos.get_invoices_to_render(self.pos.db.invoices));
                            self.toggle_save_button();
                            self.pos.selected_invoice = self.pos.db.get_invoice_by_id(self.selected_invoice.id);
                            self.gui.show_screen('invoice_payment');
                        });
                    }).fail(function () {
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

    render_paymentlines: function () {
        var self  = this;
        var order = this.pos.get_order();
        if (!order) {
            return;
        }
        if (!this.pos.selected_invoice) {
            return;
        }
        order.invoice_to_pay = this.pos.selected_invoice;

        order.invoice_to_pay.get_due = function (paymentline) {
            var total = self.pos.selected_invoice.residual,
            due = 0,
            lines = order.paymentlines.models;
            if (!paymentline) {
                due = total - order.get_total_paid();
            } else {
                due = total;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] === paymentline) {
                        break;
                    } else {
                        due -= lines[i].get_amount();
                    }
                }
            }
            return round_pr(Math.max(0,due), self.pos.currency.rounding);

        };

        order.invoice_to_pay.get_change = function (paymentline) {
            var due = self.pos.selected_invoice.residual,
            change = 0,
            lines = order.paymentlines.models;
            if (!paymentline) {
                change = -due + order.get_total_paid();
            } else {
                change = -due;
                for (var i = 0; i < lines.length; i++) {
                    change += lines[i].get_amount();
                    if (lines[i] === paymentline) {
                        break;
                    }
                }
            }
            return round_pr(Math.max(0,change), self.pos.currency.rounding);
        };

        order.invoice_to_pay.get_subtotal = function () {
            var tax = self.pos.selected_invoice.amount_tax;
            var due = self.pos.selected_invoice.residual;
            var subtotal = due -tax;
            return round_pr(Math.max(0,subtotal), self.pos.currency.rounding);
        };

        var lines = order.get_paymentlines();
        var due = order.invoice_to_pay.amount_due;
        var extradue = 0;

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

    finalize_validation: function () {
        var self = this;
        var order = this.pos.get_order();
        order.invoice_to_pay = this.pos.selected_invoice;
        if (order.is_paid_with_cash() && this.pos.config.iface_cashdrawer) {
            this.pos.proxy.open_cashbox();
        }
        order.initialize_validation_date();
        if (order.is_to_invoice()) {
            this.pos.push_order(order).then(function () {
                self.pos.update_or_fetch_invoice(self.pos.selected_invoice.id);
                self.gui.show_screen('invoice_receipt');
                 new Model('account.invoice').
                    call('invoice_print', [order.invoice_to_pay.id]).
                    then(function (action) {
                self.chrome.do_action(action);
                });
            });
        } else {
            this.pos.push_order(order).then(function(res) {
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
    render_receipt: function () {
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
