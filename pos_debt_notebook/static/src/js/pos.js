odoo.define('pos_debt_notebook.pos', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var utils = require('web.utils');
    var Model = require('web.DataModel');

    var QWeb = core.qweb;
    var _t = core._t;
    var round_pr = utils.round_precision;

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            this.reload_debts_partner_ids = [];
            this.reload_debts_ready = $.when();
            var partner_model = _.find(this.models, function(model){ return model.model === 'res.partner'; });
            partner_model.fields.push('debt_type', 'debt', 'debt_limit');
            var journal_model = _.find(this.models, function(model){ return model.model === 'account.journal'; });
            journal_model.fields.push('debt');
            var product_model = _.find(this.models, function(model){ return model.model === 'product.product'; });
            product_model.fields.push('credit_product');
            return _super_posmodel.initialize.call(this, session, attributes);
        },
        _save_to_server: function (orders, options) {
            var self = this;
            var def = _super_posmodel._save_to_server.call(this, orders, options);
            var partner_ids = [];
            _.each(orders, function(o){
                if (o.data.updates_debt && o.data.partner_id)
                    partner_ids.push(o.data.partner_id);
            });
            partner_ids = _.unique(partner_ids);
            if (partner_ids.length){
                return def.then(function(server_ids){
                    self.reload_debts(partner_ids);
                    return server_ids;
                });
            }else{
                return def;
            }
        },
        reload_debts: function(partner_ids, limit, options){
            /**
             @param {Array} partner_ids
             @param {Number} limit
             @param {Object} options
               * "shadow" - set true to load in background (i.e. without blocking the screen). Default is True
               * "postpone" - make a short delay before actual requesting to
                 gather partner_ids from other calls and request them at once.
                 Default is true

             **/

            // FIXME: on multiple calls limit value from last call is conly used.
            // We probably need to have different partner_ids list (like reload_debts_partner_ids) for each limit value, e.g.
            // limit=0 -> partner_ids=[1,2,3]
            // limit=10 -> partner_ids = [1, 101, 102, 103]
            //
            // As for shadow it seems ok to use last value

            var self = this;
            // function is called whenever we need to update debt value from server
            if (typeof limit === "undefined"){
                limit = 0;
            }
            options = options || {};
            if (typeof options.postpone === "undefined"){
                options.postpone = true;
            }
            if (typeof options.shadow === "undefined"){
                options.shadow = true;
            }

            this.reload_debts_partner_ids = this.reload_debts_partner_ids.concat(partner_ids);
            if (options.postpone && this.reload_debts_ready.state() == 'resolved'){
                // add timeout to gather requests before reloading
                var def = $.Deferred();
                this.reload_debts_ready = def;
                setTimeout(function(){
                    def.resolve();
                }, 1000);
            }
            this.reload_debts_ready = this.reload_debts_ready.then(function(){
                if (self.reload_debts_partner_ids.length > 0) {
                    var load_partner_ids = _.uniq(self.reload_debts_partner_ids.splice(0));
                    var new_partners = _.any(load_partner_ids, function(id){
                        return !self.db.get_partner_by_id(id);
                    });
                    var def;
                    if (new_partners){
                        def = self.load_new_partners();
                    }else{
                        def = $.when();
                    }
                    return def.then(function(){
                        var request_finished = $.Deferred();

                        self._load_debts(load_partner_ids, limit, options).then(function (data) {
                            // success
                            self._on_load_debts(data);
                        }).always(function(){
                            // allow to do next call
                            request_finished.resolve();
                        }).fail(function () {
                            // make request again
                            self.reload_debts(load_partner_ids, 0, {"postpone": true, "shadow": false});
                        });
                        return request_finished;
                    });
                }
            });
            return this.reload_debts_ready;
        },
        _load_debts: function(partner_ids, limit, options){
            return new Model('res.partner').call('debt_history', [partner_ids], {'limit': limit}, {'shadow': options.shadow});
        },
        _on_load_debts: function(debts){
            var partner_ids = _.map(debts, function(debt){ return debt.partner_id; });
            for (var i = 0; i < debts.length; i++) {
                    var partner = this.db.get_partner_by_id(debts[i].partner_id);
                    partner.debt = debts[i].debt;
                    partner.records_count = debts[i].records_count;
                    partner.history = debts[i].history;
                }
                this.trigger('updateDebtHistory', partner_ids);
        }
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function (session, attributes) {
            this.on('change:client', function(){
                // reload debt history whenever we set customer,
                // because debt value can be obsolete due to network issues
                // and pos_longpolling status is not 100% gurantee
                var client = this.get_client();
                if (client)
                    // reload only debt value, use background mode, send request immediatly
                    this.pos.reload_debts([client.id], 0, {"postpone": false});
            }, this);
            return _super_order.initialize.call(this, session, attributes);
        },

        updates_debt: function(){
            // wheither order update debt value
            return this.has_credit_product() || this.has_debt_journal();
        },
        has_debt_journal: function(){
            return this.paymentlines.any(function(line){
                    return line.cashregister.journal.debt;
                });
        },
        has_credit_product: function(){
            return this.orderlines.any(function(line){
                return line.product.credit_product;
            });
        },
        get_debt_delta: function(){
            var debt_amount = 0;
            var plines = this.get_paymentlines();
            for (var i = 0; i < plines.length; i++) {
                if (plines[i].cashregister.journal.debt) {
                    debt_amount += plines[i].amount;
                }
            }
            this.orderlines.each(function(line){
                if (line.product.credit_product){
                    debt_amount -= line.get_price_without_tax();
                }
            });
            return debt_amount;
        },
        export_as_JSON: function(){
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.updates_debt = this.updates_debt();
            return data;
        },
        export_for_printing: function(){
            var data = _super_order.export_for_printing.apply(this, arguments);
            var client = this.get_client();
            if (client){
                var rounding = this.pos.currency.rounding;
                data.debt_before = round_pr(this.debt_before, rounding);
                data.debt_after = round_pr(this.debt_after, rounding);
                data.debt_type = client.debt_type;

            }
            return data;
        },
        add_paymentline: function(cashregister) {
            this.assert_editable();
            var self = this;
            var journal = cashregister.journal;
            if (!this.get_client() && (this.has_credit_product() || journal.debt)){
                setTimeout(function(){
                    self.pos.gui.show_screen('clientlist');
                }, 30);
            }

            var newPaymentline = new models.Paymentline({},{order: this, cashregister: cashregister, pos: this.pos});
            if (cashregister.journal.debt){
                newPaymentline.set_amount(this.get_due_debt());
            } else if (cashregister.journal.type !== 'cash' || this.pos.config.iface_precompute_cash){
                newPaymentline.set_amount(this.get_due());
            }
            this.paymentlines.add(newPaymentline);
            this.select_paymentline(newPaymentline);
        },
        get_due_debt: function(paymentline) {
            var due = this.get_total_with_tax() - this.get_total_paid();
            if (paymentline) {
                due = this.get_total_with_tax();
                var lines = this.paymentlines.models;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] === paymentline) {
                        break;
                    } else {
                        due -= lines[i].get_amount();
                    }
                }
            }
            return round_pr(due, this.pos.currency.rounding);
        }
    });

    screens.PaymentScreenWidget.include({
        init: function(parent, options) {
            this._super(parent, options);
            this.pos.on('updateDebtHistory', function(partner_ids){
                this.update_debt_history(partner_ids);
            }, this);
        },
        update_debt_history: function (partner_ids){
            var client = this.pos.get_client();
            if (client && $.inArray(client.id, partner_ids) != -1) {
                this.gui.screen_instances.products.actionpad.renderElement();
                this.customer_changed();
            }
        },
        validate_order: function(options) {
            var currentOrder = this.pos.get_order();
            var isDebt = currentOrder.updates_debt();
            var debt_amount = currentOrder.get_debt_delta();
            var client = currentOrder.get_client();
            if (client){
                currentOrder.debt_before = client.debt;
                currentOrder.debt_after = currentOrder.debt_before + debt_amount;
            } else {
                currentOrder.debt_before = false;
                currentOrder.debt_after = false;
            }
            if (isDebt && !client){
                this.gui.show_popup('error',{
                    'title': _t('Unknown customer'),
                    'body': _t('You cannot use Debt payment. Select customer first.'),
                });
                return;
            }
            if (currentOrder.has_credit_product() && !client){
                this.gui.show_popup('error',{
                    'title': _t('Unknown customer'),
                    'body': _t("Don't forget to specify Customer when sell Credits."),
                });
                return;
            }
            if(isDebt && currentOrder.get_orderlines().length === 0){
                this.gui.show_popup('error',{
                    'title': _t('Empty Order'),
                    'body': _t('There must be at least one product in your order before it can be validated. (Hint: you can use some dummy zero price product)'),
                });
                return;
            }
            if (client && debt_amount > 0 && client.debt + debt_amount > client.debt_limit) {
                this.gui.show_popup('error', {
                    'title': _t('Max Debt exceeded'),
                    'body': _t('You cannot sell products on credit to the customer, because his max debt value will be exceeded.')
                });
                return;
            }
            client && this.pos.gui.screen_instances.clientlist.partner_cache.clear_node(client.id);
            this._super(options);
        },

        pay_full_debt: function(){
            var order = this.pos.get_order();
            
            var debtjournal = false;
            _.each(this.pos.cashregisters, function(cashregister) {
                if (cashregister.journal.debt) {
                    debtjournal = cashregister;
                }

            });

            var paymentLines = order.get_paymentlines();
            if (paymentLines.length) {
                _.each(paymentLines.models, function(paymentLine) {
                    if (paymentLine.cashregister.journal.debt){
                        paymentLine.destroy();
                    }
                });
            }

            var newDebtPaymentline = new models.Paymentline({},{order: order, cashregister: debtjournal, pos: this.pos});
            newDebtPaymentline.set_amount(order.get_client().debt * -1);
            order.paymentlines.add(newDebtPaymentline);
            this.render_paymentlines();
        },

        /* I inherit the native is_paid() method below for the following reason:
        without this inherit, if you have a customer with a debt and he comes
        to pay his debt without buying new items:
        1) cashier selects "debt journal"
        2) cashier selects the customer and clicks on "Select Customer and Pay Full Debt"
        3) a dummy product is automatically added to the pos order and
           the debt journal is selected with a negative amount corresponding
           to the debt.
           AT THAT MOMENT, the "Validate" button is active...
           so the cashier can click on it by accident !
           He should not, because he still has to select the payment method used
           to pay the debt.
        This problem is linked to the fact that the native is_paid() method
        returns with the following code:
        return (currentOrder.getTotalTaxIncluded() < 0.000001
                            || currentOrder.getPaidTotal() + 0.000001 >= currentOrder.getTotalTaxIncluded());
        (cf odoo/addons/point_of_sale/static/src/js/screens.js line 1256)
        So is_paid() always returns True when
        "currentOrder.getTotalTaxIncluded() < 0.000001" which is the case
        in this scenario with a pos.order with the dummy product with price = 0
        I must say that I don't understand what is the use case behind the
        "currentOrder.getTotalTaxIncluded() < 0.000001" */
        is_paid: function(){
            var currentOrder = this.pos.get_order();
            return (currentOrder.getPaidTotal() + 0.000001 >= currentOrder.getTotalTaxIncluded());
        },
        customer_changed: function() {
            var self = this;
            var client = this.pos.get_client();
            var debt = 0;
            if (client) {
                debt = Math.round(client.debt * 100) / 100;
                if (client.debt_type == 'credit') {
                    debt = - debt;
                }
            }
            var $js_customer_name = this.$('.js_customer_name');
            var $pay_full_debt = this.$('.pay-full-debt');
            $js_customer_name.text(client ? client.name : _t('Customer'));
            $pay_full_debt.on('click', function() {self.pay_full_debt();});
            $pay_full_debt.addClass('oe_hidden');
            if (client && debt) {
                if (client.debt_type == 'debt') {
                    if (debt > 0) {
                        $pay_full_debt.removeClass('oe_hidden');
                        $js_customer_name.append('<span class="client-debt positive"> [Debt: ' + debt + ']</span>');
                    } else if (debt < 0) {
                        $js_customer_name.append('<span class="client-debt negative"> [Debt: ' + debt + ']</span>');
                    }
                } else if (client.debt_type == 'credit') {
                    if (debt > 0) {
                        $js_customer_name.append('<span class="client-credit positive"> [Credit: ' + debt + ']</span>');
                    } else if (debt < 0) {
                        $pay_full_debt.removeClass('oe_hidden');
                        $js_customer_name.append('<span class="client-credit negative"> [Credit: ' + debt + ']</span>');
                    }
                }
            }
        }
    });

    gui.Gui.prototype.screen_classes.filter(function(el) { return el.name == 'clientlist';})[0].widget.include({
        init: function(parent, options){
            this._super(parent, options);
            this.round = function(value) {
                return Math.round(value * 100) / 100;
            };
            this.check_user_in_group = function(group_id, groups) {
                return  $.inArray(group_id, groups) != -1;
            };
            this.pos.on('updateDebtHistory', function(partner_ids){
                this.update_debt_history(partner_ids);
            }, this);
        },
        update_debt_history: function (partner_ids){
            var self = this;
            if (this.new_client && $.inArray(this.new_client.id, partner_ids) != -1) {
                var debt = this.pos.db.get_partner_by_id(this.new_client.id).debt;
                if (this.new_client.debt_type == 'credit') {
                    debt = - debt;
                }
                debt = this.format_currency(debt);
                $('.client-detail .detail.client-debt').text(debt);
            }
            _.each(partner_ids, function(id){
                self.partner_cache.clear_node(id);
            });
            var customers = this.pos.db.get_partners_sorted(1000);
            this.render_list(customers);
        },
        render_list: function(partners){
            var debt_type = partners && partners.length ? partners[0].debt_type : '';
            if (debt_type == 'debt') {
                this.$('#client-list-credit').remove();
            } else if (debt_type == 'credit') {
                this.$('#client-list-debt').remove();
            }
            this._super(partners);
        },
        render_debt_history: function(partner){
            var contents = this.$el[0].querySelector('#debt_history_contents');
            contents.innerHTML = "";
            var debt_type = partner.debt_type;
            var debt_history = partner.history;
            var sign = debt_type == 'credit' ? -1 : 1;
            if (debt_history) {
                var total_balance = partner.debt;
                for (var i = 0; i < debt_history.length; i++) {
                    debt_history[i].total_balance = sign * Math.round(total_balance * 100) / 100;
                    total_balance += debt_history[i].balance;
                }
                for (var i = 0; i < debt_history.length; i++) {
                    var debt_history_line_html = QWeb.render('DebtHistoryLine', {
                        partner: partner,
                        line: debt_history[i]
                    });
                    var debt_history_line = document.createElement('tbody');
                    debt_history_line.innerHTML = debt_history_line_html;
                    debt_history_line = debt_history_line.childNodes[1];
                    contents.appendChild(debt_history_line);
                }
            }
        },
        toggle_save_button: function(){
            this._super();
            var self = this;
            var $pay_full_debt = this.$('#set-customer-pay-full-debt');
            var $show_customers = this.$('#show_customers');
            var $show_debt_history = this.$('#show_debt_history');
            var $debt_history = this.$('#debt_history');
            var curr_client = this.pos.get_order().get_client();
            var client = this.new_client || curr_client;
            if (this.editing_client) {
                $pay_full_debt.addClass('oe_hidden');
                $show_debt_history.addClass('oe_hidden');
                $show_customers.addClass('oe_hidden');
            } else {
                if ((this.new_client && this.new_client.debt > 0) ||
                        (curr_client && curr_client.debt > 0 && !this.new_client)) {
                    $pay_full_debt.removeClass('oe_hidden');
                }else{
                    $pay_full_debt.addClass('oe_hidden');
                }
                if (client) {
                    $show_debt_history.removeClass('oe_hidden');
                    $show_debt_history.on('click', function () {
                        var $loading_history = $('#loading_history');
                        $loading_history.removeClass('oe_hidden');
                        self.render_debt_history(client);
                        $('.client-list').addClass('oe_hidden');
                        $debt_history.removeClass('oe_hidden');
                        $show_debt_history.addClass('oe_hidden');
                        $show_customers.removeClass('oe_hidden');
                        // TODO add "Load more" button
                        var debt_history_limit = 10;
                        self.pos.reload_debts(
                            client.id,
                            debt_history_limit,
                            {"postpone": false}
                        ).then(
                                function () {
                                    self.render_debt_history(client);
                                    $loading_history.addClass('oe_hidden');
                                });
                    });
                } else {
                    $show_debt_history.addClass('oe_hidden');
                    $show_debt_history.off();
                }
            }
        },

        show: function(){
            this._super();
            var self = this;
            this.$('#set-customer-pay-full-debt').click(function(){
                self.save_changes();
                if (self.new_client.debt <= 0) {
                    self.gui.show_popup('error',{
                        'title': _t('Error: No Debt'),
                        'body': _t('The selected customer has no debt.'),
                    });
                    return;
                }
                // if the order is empty, add a dummy product with price = 0
                var order = self.pos.get_order();
                if (order) {
                    var lastorderline = order.get_last_orderline();
                    if (lastorderline === null && self.pos.config.debt_dummy_product_id){
                        var dummy_product = self.pos.db.get_product_by_id(
                            self.pos.config.debt_dummy_product_id[0]);
                        order.add_product(dummy_product, {'price': 0});
                    }
                }

                // select debt journal
                var debtjournal = false;
                _.each(self.pos.cashregisters, function(cashregister) {
                    if (cashregister.journal.debt) {
                        debtjournal = cashregister;
                    }
                });

                // add payment line with amount = debt *-1
                var paymentLines = order.get_paymentlines();
                if (paymentLines.length) {
                    /* Delete existing debt line
                    Usefull for the scenario where a customer comes to
                    pay his debt and the user clicks on the "Debt journal"
                    which opens the partner list and then selects partner
                    and clicks on "Select Customer and Pay Full Debt" */
                    _.each(paymentLines.models, function(paymentLine) {
                        if (paymentLine.cashregister.journal.debt){
                            paymentLine.destroy();
                        }
                    });
                }

                var newDebtPaymentline = new models.Paymentline({},{order: order, cashregister: debtjournal, pos: self.pos});
                newDebtPaymentline.set_amount(self.new_client.debt * -1);
                order.paymentlines.add(newDebtPaymentline);
                self.gui.show_screen('payment');
            });
            var $show_customers = $('#show_customers');
            var $show_debt_history = $('#show_debt_history');
            if (this.pos.get_order().get_client() || this.new_client) {
                $show_debt_history.removeClass('oe_hidden');
            }
            $show_customers.off().on('click', function () {
                $('.client-list').removeClass('oe_hidden');
                $('#debt_history').addClass('oe_hidden');
                $show_customers.addClass('oe_hidden');
                $show_debt_history.removeClass('oe_hidden');
            });
        },
        saved_client_details: function(partner_id){
            this.pos.gui.screen_instances.clientlist.partner_cache.clear_node(partner_id);
            this._super(partner_id);
        },
        reload_partners: function(){
            var self = this;
            return this._super().then(function () {
                self.render_list(self.pos.db.get_partners_sorted(1000));
            });
        }
    });
});
