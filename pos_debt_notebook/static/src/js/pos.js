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
            var self = this;
            this.reload_debts_partner_ids = [];
            this.reload_debts_ready = $.when();
            models.load_fields("res.partner",['debt_type', 'debt']);
            models.load_fields('account.journal',['debt', 'debt_limit','credits_via_discount','pos_cash_out','category_ids']);
            models.load_fields('product.product',['credit_product']);
            _super_posmodel.initialize.apply(this, arguments);
            this.ready.then(function () {
                var partner_ids = _.map(self.partners, function(p){
                    return p.id;
                });
                self.reload_debts(partner_ids, 0, {"postpone": false});
            });
        },
        _save_to_server: function (orders, options) {
            var self = this;
            var def = _super_posmodel._save_to_server.apply(this, arguments);
            var partner_ids = [];
            _.each(orders, function(o){
                if (o.data.updates_debt && o.data.partner_id) {
                    partner_ids.push(o.data.partner_id);
                }
            });
            partner_ids = _.unique(partner_ids);
            if (partner_ids.length){
                return def.then(function(server_ids){
                    self.reload_debts(partner_ids);
                    return server_ids;
                });
            }
            return def;
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
            if (options.postpone && this.reload_debts_ready.state() === 'resolved'){
                // add timeout to gather requests before reloading
                var reload_ready_def = $.Deferred();
                this.reload_debts_ready = reload_ready_def;
                setTimeout(function(){
                    reload_ready_def.resolve();
                }, 1000);
            }
            this.reload_debts_ready = this.reload_debts_ready.then(function(){
                if (self.reload_debts_partner_ids.length > 0) {
                    var load_partner_ids = _.uniq(self.reload_debts_partner_ids.splice(0));
                    var new_partners = _.any(load_partner_ids, function(id){
                        return !self.db.get_partner_by_id(id);
                    });
                    var def = $.when();
                    if (new_partners) {
                        def = self.load_new_partners();
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
                            // make request again, Timeout is set to allow properly work in offline mode
                            setTimeout(_.bind(self.reload_debts, self,
                                load_partner_ids, 0, {"postpone": true, "shadow": false}), 3000);
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
            var partner_ids = _.map(debts, function(debt){
                return debt.partner_id;
            });
            for (var i = 0; i < debts.length; i++) {
                    var partner = this.db.get_partner_by_id(debts[i].partner_id);
                    partner.debt = debts[i].debt;
                    partner.debts = debts[i].debts;
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
                if (client) {
                    // reload only debt value, use background mode, send request immediatly
                    this.pos.reload_debts([client.id], 0, {"postpone": false});
                }
            }, this);
            return _super_order.initialize.apply(this, arguments);
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
        get_summary_for_cashregister: function(cashregister) {
            var self = this;
            return _.reduce(this.paymentlines.models, function(memo, pl){
                if (pl.cashregister.journal_id[0] === cashregister.journal.id) {
                    return memo + pl.amount - self.get_change(pl);
                }
                return memo;
            }, 0);
        },
        get_summary_for_categories: function(category_list) {
            var self = this;
            return _.reduce(this.orderlines.models, function(memo, ol){
                category_list = _.union(category_list, _.flatten(_.map(category_list, function(cl){
                    return self.pos.db.get_category_childs_ids(cl);
                })));
                if (_.contains(category_list, ol.product.pos_categ_id[0])) {
                    return memo + ol.get_display_price();
                }
                return memo;
            }, 0);
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

            var newPaymentline = new models.Paymentline({}, {
                order: this,
                cashregister: cashregister,
                pos: this.pos
            });
            if (cashregister.journal.debt && this.get_client()){
                var category_list = cashregister.journal.category_ids;
                var partner_balance = this.pos.get_client().debts[journal.id].balance;
                var amount = this.get_due();
                //already tendered amount for this journal
                var sum_pl = this.get_summary_for_cashregister(cashregister);
                if (this.get_due_debt() < 0) {
                    amount = this.get_due_debt();
                } else if (category_list.length) {
                    //required summary
                    var sum_prod = this.get_summary_for_categories(category_list);
                    amount = Math.max(Math.min(
                        sum_prod - sum_pl,
                        amount,
                        journal.debt_limit - sum_pl + partner_balance), 0);
                } else {
                    amount = Math.max(Math.min(
                        amount,
                        journal.debt_limit - sum_pl + partner_balance), 0);
                }
                newPaymentline.set_amount(amount);
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
        },
        get_change: function(paymentline) {
            var result = _super_order.get_change.apply(this, arguments);

            if (!paymentline){
                var sum = _.filter(this.get_paymentlines(), function(pl){
                    return pl.cashregister.journal.credits_via_discount;
                });
                sum = _.reduce(sum,function(memo, o){
                    return memo + o.amount;
                },0);
                result = this.get_total_paid() - this.get_total_with_tax() - sum;
            }
            return result;
        },
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
            if (client && $.inArray(client.id, partner_ids) !== -1) {
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
            var exceeding_debts = this.exceeding_debts_check()
            if (client && debt_amount > 0 && exceeding_debts) {
                this.gui.show_popup('error', {
                    'title': _t('Max Debt exceeded'),
                    'body': _t('You cannot sell products on credit journal ' + exceeding_debts + ' to the customer because its max debt value will be exceeded.')
                });
                return;
            }
            if (this.debt_change_check()) {
                this.gui.show_popup('error', {
                    'title': _t('Unable to return the change or cash out with the debt payment method'),
                    'body': _t('Please enter the exact or lower debt amount than the cost of the order.')
                });
                return;
            }
            var violations = this.debt_journal_restricted_categories_check();
            if (violations.length) {
                this.gui.show_popup('error', {
                    'title': _t('Unable to validate with the debt payment method'),
                    'body': _t(this.restricted_categories_message(violations)),
                });
                return;
            }
            client && this.pos.gui.screen_instances.clientlist.partner_cache.clear_node(client.id);
            this._super(options);
        },
        finalize_validation: function() {
            var self = this;
            var order = this.pos.get_order(),
            paymentlines = order.get_paymentlines(),
            order_total = round_pr(order.get_total_with_tax(), self.pos.currency.rounding),
            partner = this.pos.get_client();
            var disc_credits = _.filter(paymentlines, function(pl){
                return pl.cashregister.journal.credits_via_discount === true;
            });
            if (disc_credits.length && order_total) {
                var sum = _.reduce(disc_credits, function(memo, num){
                    return memo + num.amount;
                }, 0);
                var percentage = ( sum / order_total ) * 100;
                var orderlines = order.get_orderlines();
                _.each(orderlines, function(ol){
                    ol.set_discount(percentage);
                });
                this._super();
                if (partner) {
                    var deb = {};
                    _.each(paymentlines, function(pl){
                        deb = _.find(_.values(partner.debts), function(d){
                            return d.journal_id[0] === pl.cashregister.journal.id;
                        });
                        if(deb && deb.balance){
                            deb.balance -= pl.amount;
                        }
                    });
                    partner.debt = _.reduce(partner.debts, function(memo, d){
                        return memo + d.balance;
                    }, 0);
                    if(partner.debt_type === 'debt'){
                        partner.debt = - partner.debt;
                    }
                }
            } else {
                this._super();
            }
        },
        restricted_categories_message: function(cashregisters) {
            var self = this;
            var body = [];
            var categ_names = '';
            _.each(cashregisters, function(cr) {
                var journal = cr.journal;
                _.each(journal.category_ids, function(categ) {
                    categ_names += self.pos.db.get_category_by_id(categ).name + ' ';
                });
                body.push(categ_names + ' with ' + cr.journal_id[1] + ' ');
            });
            return 'You may only buy ' + body.toString();
        },
        debt_journal_restricted_categories_check: function(){
            var self = this;
            var order = this.pos.get_order(),
            paymentlines = order.get_paymentlines(),
            orderlines = order.get_orderlines();
            var paymentlines_with_restrictions = _.filter(paymentlines, function(pl){
                return pl.cashregister.journal.category_ids.length > 0;
            });
            var violations = [];
            if (paymentlines_with_restrictions) {
                var cashregisters = _.uniq(_.map(paymentlines_with_restrictions, function(pcr){
                    return pcr.cashregister;
                }));
                var sum_pl = 0,
                sum_prod = 0;
                _.each(cashregisters, function(cr){
                    var journal = cr.journal;
                    //summary paid by each journal
                    sum_pl = order.get_summary_for_cashregister(cr);
                    sum_pl = round_pr(sum_pl, self.pos.currency.rounding)
                    //summary allowed to pay
                    sum_prod = order.get_summary_for_categories(journal.category_ids);
                    sum_prod = round_pr(sum_prod, self.pos.currency.rounding)
                    if (sum_pl > sum_prod) {
                        violations.push(cr);
                    }
                });
            }
            return violations;
        },
        exceeding_debts_check: function(){
            var order = this.pos.get_order(),
            paymentlines = order.get_paymentlines(),
            debts = this.pos.get_client().debts,
            flag = false;
            _.each(paymentlines, function(pl){
                var cr = pl.cashregister;
                if (cr.journal.debt) {
                    var debt_limit = cr.journal.debt_limit;
                    var sum_pl = order.get_summary_for_cashregister(cr);
                    if (sum_pl > debt_limit) {
                        flag = cr.journal_id[1];
                    }
                }
            });
            return flag;
        },
        debt_change_check: function () {
            var order = this.pos.get_order(),
                paymentlines = order.get_paymentlines(),
                flag = false;
            for (var i = 0; i < paymentlines.length; i++) {
                var journal = paymentlines[i].cashregister.journal;
                if (order.get_change(paymentlines[i]) > 0 && journal.debt && !journal.pos_cash_out){
                    flag = true;
                }
            }
            return flag;
        },
        pay_full_debt: function(){
            var self = this;
            var order = this.pos.get_order();
            if (order && !order.orderlines.length && this.pos.config.debt_dummy_product_id){
                order.add_product(
                    this.pos.db.get_product_by_id(this.pos.config.debt_dummy_product_id[0]),
                    {'price': 0}
                );
            }

            var paymentLines = order.get_paymentlines();
            if (paymentLines.length) {
                _.each(paymentLines, function(paymentLine) {
                    if (paymentLine.cashregister.journal.debt){
                        paymentLine.destroy();
                    }
                });
            }

            var debts = order.get_client().debts;
            _.each(debts, function(debt) {
                if (debt.balance < 0) {
                    var newDebtPaymentline = new models.Paymentline({},{
                        pos: self.pos,
                        order: order,
                        cashregister: _.find(self.pos.cashregisters, function(cr){
                            return cr.journal_id[0] === debt.journal_id[0];
                        })
                    });
                    newDebtPaymentline.set_amount(debt.balance);
                    order.paymentlines.add(newDebtPaymentline);
                }
            });

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
            return currentOrder.getPaidTotal() + 0.000001 >= currentOrder.getTotalTaxIncluded();
        },
        customer_changed: function() {
            var self = this;
            var client = this.pos.get_client();
            var debt = 0;
            var deb_type = 1;
            if (client) {
                debt = Math.round(client.debt * 100) / 100;
                if (client.debt_type === 'credit') {
                    debt = - debt;
                    deb_type = -1;
                }
            }
            var $js_customer_name = this.$('.js_customer_name');
            var $pay_full_debt = this.$('.pay-full-debt');
            $js_customer_name.text(
                client
                    ? client.name
                    : _t('Customer')
            );
            $pay_full_debt.unbind().on('click', function() {
                self.pay_full_debt();
            });
            $pay_full_debt.addClass('oe_hidden');
            if (client && debt) {
                if (client.debt_type === 'debt') {
                    if (debt > 0) {
                        $pay_full_debt.removeClass('oe_hidden');
                        $js_customer_name.append('<span class="client-debt positive"> [Debt: ' + debt + ']</span>');
                    } else if (debt < 0) {
                        $js_customer_name.append('<span class="client-debt negative"> [Debt: ' + debt + ']</span>');
                    }
                } else if (client.debt_type === 'credit') {
                    if (debt > 0) {
                        $js_customer_name.append('<span class="client-credit positive"> [Credit: ' + debt + ']</span>');
                    } else if (debt < 0) {
                        $pay_full_debt.removeClass('oe_hidden');
                        $js_customer_name.append('<span class="client-credit negative"> [Credit: ' + debt + ']</span>');
                    }
                }
            }
            var $paymentmethods = this.$('.paymentmethods');
            if (client && client.debts && $paymentmethods.children()) {
                _.each($paymentmethods.children(), function(pm) {
                    var pm_id = pm.dataset.id;
                    var credit_line_html = '';
                    if (client.debts[pm_id]) {
                        credit_line_html = QWeb.render('CreditNote', {
                            debt: deb_type * client.debts[pm_id].balance,
                            widget: self
                        });
                    }
                    var prev_debt = _.filter(pm.children, function(c){
                       return _.includes(c.classList, 'client-debt') || _.includes(c.classList, 'client-credit');
                    });
                    if (prev_debt){
                        _.map(prev_debt, function(pd){
                            pd.remove();
                        });
                    }
                    pm.innerHTML += credit_line_html;
                });
            }
        },
    });

    gui.Gui.prototype.screen_classes.filter(function(el) {
        return el.name === 'clientlist';
    })[0].widget.include({
        init: function(parent, options){
            this._super(parent, options);
            this.round = function(value) {
                return Math.round(value * 100) / 100;
            };
            this.check_user_in_group = function(group_id, groups) {
                return $.inArray(group_id, groups) !== -1;
            };
            this.pos.on('updateDebtHistory', function(partner_ids){
                this.update_debt_history(partner_ids);
            }, this);
            this.debt_history_limit_initial = 10;
            this.debt_history_limit_increment = 10;
        },
        line_select: function(event,$line,id){
            this._super(event,$line,id);
            this.selected_line = arguments;
            this.pos.reload_debts(id, 0, {"postpone": false});
        },
        update_debt_history: function (partner_ids){
            var self = this;
            if (this.new_client && $.inArray(this.new_client.id, partner_ids) !== -1) {
                var debt = this.pos.db.get_partner_by_id(this.new_client.id).debt;
                if (this.new_client.debt_type === 'credit') {
                    debt = - debt;
                }
                debt = this.format_currency(debt);
                $('.client-detail .detail.client-debt').text(debt);
            }
            _.each(partner_ids, function(id){
                var partner = self.pos.db.get_partner_by_id(id);
                var debts = _.values(partner.debts);
                if(partner.debts){
                    var credit_lines_html = '';
                    credit_lines_html = QWeb.render('CreditList', {
                        partner: partner,
                        debts: debts,
                        widget: self
                    });
                    $('div.credit_list').html(credit_lines_html);
                }
            });
            _.each(partner_ids, function(id){
                self.partner_cache.clear_node(id);
            });
            var customers = this.pos.db.get_partners_sorted(1000);
            this.render_list(customers);
        },
        render_list: function(partners){
            var debt_type = partners && partners.length
                ? partners[0].debt_type
                : '';
            if (debt_type === 'debt') {
                this.$('#client-list-credit').remove();
            } else if (debt_type === 'credit') {
                this.$('#client-list-debt').remove();
            }
            if (this.selected_line && this.selected_line[2]){
                this.old_client = this.pos.db.get_partner_by_id(this.selected_line[2]);
            }
            this._super(partners);
            this.old_client = this.pos.get_client();
            this.selected_line = false;
        },
        render_debt_history: function(partner){
            var self = this;
            var contents = this.$el[0].querySelector('#debt_history_contents');
            contents.innerHTML = "";
            var debt_type = partner.debt_type;
            var debt_history = partner.history;
            var sign = debt_type === 'credit'
                ? -1
                : 1;
            if (debt_history) {
                var total_balance = partner.debt;
                for (var i = 0; i < debt_history.length; i++) {
                    debt_history[i].total_balance = sign * Math.round(total_balance * 100) / 100;
                    total_balance += debt_history[i].balance;
                }
                for (var y = 0; y < debt_history.length; y++) {
                    var debt_history_line_html = QWeb.render('DebtHistoryLine', {
                        partner: partner,
                        line: debt_history[y]
                    });
                    var debt_history_line = document.createElement('tbody');
                    debt_history_line.innerHTML = debt_history_line_html;
                    debt_history_line = debt_history_line.childNodes[1];
                    contents.appendChild(debt_history_line);
                }
                if (debt_history.length !== partner.records_count) {
                    var debt_history_load_more_html = QWeb.render('DebtHistoryLoadMore');
                    var debt_history_load_more = document.createElement('tbody');
                    debt_history_load_more.innerHTML = debt_history_load_more_html;
                    debt_history_load_more = debt_history_load_more.childNodes[1];
                    contents.appendChild(debt_history_load_more);
                    this.$('#load_more').on('click', function () {
                        self.pos.reload_debts(
                            partner.id,
                            debt_history.length + self.debt_history_limit_increment,
                            {'postpone': false}
                        ).then(
                            function () {
                                self.render_debt_history(partner);
                            }
                        );
                    });
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
                        self.pos.reload_debts(
                            client.id,
                            self.debt_history_limit_initial,
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
                var client = self.new_client || self.pos.get_order().get_client();
                self.save_changes();
                if (client.debt <= 0) {
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
                newDebtPaymentline.set_amount(client.debt * -1);
                order.paymentlines.add(newDebtPaymentline);
                self.gui.show_screen('payment');
            });
            var $show_customers = $('#show_customers');
            var $show_debt_history = $('#show_debt_history');
            var client = this.pos.get_order().get_client();
            if (client || this.new_client) {
                $show_debt_history.removeClass('oe_hidden');
                this.pos.reload_debts(client.id, 0, {"postpone": false});
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
