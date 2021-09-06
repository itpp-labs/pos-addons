/* Copyright 2016-2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
 * Copyright 2016-2017 Stanislav Krotov <https://it-projects.info/team/ufaks>
 * Copyright 2017 Artyom Losev
 * Copyright 2017-2018 Gabbasov Dinar <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License MIT (https://opensource.org/licenses/MIT). */
/* eslint complexity: "off"*/

odoo.define("pos_debt_notebook.pos", function (require) {
    "use strict";

    var models = require("point_of_sale.models");
    var core = require("web.core");
    var utils = require("web.utils");
    var rpc = require("web.rpc");

    var _t = core._t;
    var round_pr = utils.round_precision;

    const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
    const ClientListScreen = require("point_of_sale.ClientListScreen");
    const PaymentScreen = require("point_of_sale.PaymentScreen");
    const Registries = require("point_of_sale.Registries");

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            this.reload_debts_partner_ids = [];
            this.reload_debts_timer = $.when();
            models.load_models({
                model: "account.journal",
                fields: [
                    "id",
                    "name",
                    "debt",
                    "debt_limit",
                    "credits_via_discount",
                    "pos_cash_out",
                    "category_ids",
                    "credits_autopay",
                ],
                ids: function (self) {
                    return _.chain(self.payment_methods)
                        .filter(function (pm) {
                            return pm.cash_journal_id;
                        })
                        .map("cash_journal_id")
                        .map("0")
                        .uniq()
                        .value();
                },
                loaded: function (self, journals) {
                    _.each(self.payment_methods, function (pm) {
                        pm.journal =
                            _.find(journals, function (j) {
                                return j.id === pm.cash_journal_id[0];
                            }) || {};
                    });
                },
            });
            models.load_fields("pos.payment.method", ["cash_journal_id"]);
            models.load_fields("product.product", ["credit_product"]);
            _super_posmodel.initialize.apply(this, arguments);
        },
        after_load_server_data: function () {
            var self = this;
            var partner_ids = _.map(this.partners, function (p) {
                return p.id;
            });

            var done = new $.Deferred();

            var progress = (this.models.length - 0.5) / this.models.length;
            this.setLoadingMessage(_t("Loading Credits data"), progress);
            this.reload_debts(partner_ids, 0, {postpone: false}).then(function () {
                var result = _super_posmodel.after_load_server_data.apply(
                    self,
                    arguments
                );
                done.resolve();
                return result;
            });
            return done;
        },
        _save_to_server: function (orders, options) {
            var self = this;
            var def = _super_posmodel._save_to_server.apply(this, arguments);
            var partner_ids = [];
            _.each(orders, function (o) {
                if (o.data.updates_debt && o.data.partner_id) {
                    partner_ids.push(o.data.partner_id);
                }
            });
            partner_ids = _.unique(partner_ids);
            if (partner_ids.length) {
                return def.then(function (server_ids) {
                    self.reload_debts(partner_ids);
                    return server_ids;
                });
            }
            return def;
        },
        reload_debts: function (partner_ids, limit, options) {
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
            // Function is called whenever we need to update debt value from server
            if (typeof limit === "undefined") {
                limit = 0;
            }
            if (partner_ids.length === 1 && !limit) {
                // Incoming data about balance updates not contains limit
                // this block changes limit only in case of opened debt history for a partner who have got an update
                // TODO: rewrite this:
                // ---------------------
                // var client_list_screen = this.gui.screen_instances.clientlist;
                // if (client_list_screen && client_list_screen.debt_history_is_opened()) {
                //     var partner = client_list_screen.new_client || this.get_client();
                //     if (partner && partner_ids[0] === partner.id) {
                //         limit =
                //             client_list_screen.history_length ||
                //             client_list_screen.debt_history_limit_initial;
                //     }
                // }
                // ---------------------
            }
            options = options || {};
            if (typeof options.postpone === "undefined") {
                options.postpone = true;
            }
            if (typeof options.shadow === "undefined") {
                options.shadow = true;
            }
            var download_debts_ready = options.deferred || $.Deferred();
            this.reload_debts_partner_ids = this.reload_debts_partner_ids.concat(
                partner_ids
            );
            if (options.postpone && this.reload_debts_timer.state() === "resolved") {
                // Add timeout to gather requests before reloading
                var reload_ready_def = $.Deferred();
                this.reload_debts_timer = reload_ready_def;
                setTimeout(
                    function () {
                        reload_ready_def.resolve();
                    },
                    typeof options.postpone === "number" ? options.postpone : 1000
                );
            }
            this.reload_debts_timer = this.reload_debts_timer.then(function () {
                if (self.reload_debts_partner_ids.length > 0) {
                    var load_partner_ids = _.uniq(
                        self.reload_debts_partner_ids.splice(0)
                    );
                    var new_partners = _.any(load_partner_ids, function (id) {
                        return !self.db.get_partner_by_id(id);
                    });
                    var def = $.Deferred();
                    if (new_partners) {
                        self.load_new_partners().always(function () {
                            // In case this function was called from saved_client_details load_new_partners may work asynchronously
                            // because saved_client_details works with deferred objects but returns nothing, so we cannot wait for it
                            // rejection means that all new partners data was already previously updated, otherwise, they were updated now
                            // related PR: https://github.com/odoo/odoo/pull/26220
                            def.resolve();
                        });
                    } else {
                        def.resolve();
                    }
                    return def.then(function () {
                        var request_finished = $.Deferred();

                        self._load_debts(load_partner_ids, limit, options).then(
                            function (data) {
                                // Success
                                download_debts_ready.resolve();
                                request_finished.resolve();
                                self._on_load_debts(data);
                            },
                            function () {
                                // Make request again, Timeout is set to allow properly work in offline mode
                                request_finished.resolve();
                                self.reload_debts(load_partner_ids, 0, {
                                    postpone: 4000,
                                    shadow: false,
                                    deferred: download_debts_ready,
                                });
                                self.trigger("updateDebtHistoryFail");
                            }
                        );
                        return request_finished;
                    });
                }
                return download_debts_ready.resolve();
            });
            return download_debts_ready;
        },
        _load_debts: function (partner_ids, limit, options) {
            return rpc
                .query(
                    {
                        model: "res.partner",
                        method: "debt_history",
                        args: [partner_ids, limit],
                    },
                    options
                )
                .then(function (res) {
                    return res;
                });
        },
        _on_load_debts: function (debts) {
            var self = this;
            var partner_ids = _.map(debts, function (debt) {
                return debt.partner_id;
            });
            _.each(_.values(debts), function (deb) {
                var partner = self.db.get_partner_by_id(deb.partner_id);
                partner.debt = deb.debt;
                partner.debts = deb.debts;
                partner.records_count = deb.records_count;
                if (deb.history && deb.history.length) {
                    // That condition prevent from rewriting partners history to nothing
                    partner.history = deb.history;
                }
            });
            this.trigger("updateDebtHistory", partner_ids);
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function (session, attributes) {
            this.on(
                "change:client",
                function () {
                    // Reload debt history whenever we set customer,
                    // because debt value can be obsolete due to network issues
                    // and pos_longpolling status is not 100% gurantee
                    var client = this.get_client();
                    if (client) {
                        // Reload only debt value, use background mode, send request immediatly
                        this.pos.reload_debts([client.id], 0, {postpone: false});
                    }
                },
                this
            );
            return _super_order.initialize.apply(this, arguments);
        },

        updates_debt: function () {
            // Wheither order update debt value
            return this.has_credit_product() || this.has_debt_journal();
        },
        has_debt_journal: function () {
            return this.paymentlines.any(function (line) {
                return line.payment_method.journal.debt;
            });
        },
        has_paymentlines_with_credits_via_discounts: function () {
            return _.filter(this.get_paymentlines(), function (pl) {
                return pl.payment_method.journal.credits_via_discount;
            });
        },
        has_credit_product: function () {
            return this.orderlines.any(function (line) {
                return line.product.credit_product;
            });
        },
        has_return_product: function () {
            return this.get_orderlines().some(function (line) {
                return line.quantity < 0;
            });
        },
        get_debt_delta: function () {
            var debt_amount = 0;
            var plines = this.get_paymentlines();
            for (var i = 0; i < plines.length; i++) {
                if (plines[i].payment_method.journal.debt) {
                    debt_amount += plines[i].amount;
                }
            }
            this.orderlines.each(function (line) {
                if (line.product.credit_product) {
                    debt_amount -= line.get_price_with_tax();
                }
            });
            return debt_amount;
        },
        export_as_JSON: function () {
            var data = _super_order.export_as_JSON.apply(this, arguments);
            data.updates_debt = this.updates_debt();
            return data;
        },
        export_for_printing: function () {
            var data = _super_order.export_for_printing.apply(this, arguments);
            var client = this.get_client();
            if (client) {
                var rounding = this.pos.currency.rounding;
                data.debt_before = round_pr(this.debt_before, rounding);
                data.debt_after = round_pr(this.debt_after, rounding);
                data.debt_type = this.pos.config.debt_type;
            }
            data.paymentlines_without_credits_via_discount = this.get_paymentlines()
                .filter((line) => {
                    return !line.payment_method.journal.credits_via_discount;
                })
                .map((line) => line.export_for_printing());
            return data;
        },
        get_payment_limits: function (cashregister, limit_code) {
            // By default with one first argument returns all limits of the cashregister
            // Output may be changed from all limits to a one particular limit by setting the second string argument
            // Available atributes 'debt_limit', 'products_restriction', 'due' and 'all' is default
            // 'debt_limit' = partner balance + debt limit
            // 'products_restriction' = sum of resticted products only
            // 'due' = remained amount to pay
            limit_code = limit_code || "all";
            var vals = {};
            if (cashregister.journal.debt) {
                var partner_balance = this.pos.get_client().debts[
                        cashregister.journal.id
                    ].balance,
                    category_list = cashregister.journal.category_ids;
                var debt_limit = round_pr(
                    partner_balance + cashregister.journal.debt_limit,
                    this.pos.currency.rounding
                );
                if (limit_code === "debt_limit" || limit_code === "all") {
                    vals.debt_limit = debt_limit;
                }
                if (
                    category_list.length &&
                    (limit_code === "products_restriction" || limit_code === "all")
                ) {
                    vals.products_restriction = this.get_summary_for_categories(
                        category_list
                    );
                }
            }
            if (limit_code === "due" || limit_code === "all") {
                vals.due = this.get_due();
            }
            return vals;
        },
        get_summary_for_cashregister: function (cashregister) {
            return _.reduce(
                this.paymentlines.models,
                function (memo, pl) {
                    if (pl.payment_method.journal.id === cashregister.journal.id) {
                        return memo + pl.amount;
                    }
                    return memo;
                },
                0
            );
        },
        get_summary_for_categories: function (category_list) {
            var self = this;
            return round_pr(
                _.reduce(
                    this.orderlines.models,
                    function (memo, ol) {
                        category_list = _.union(
                            category_list,
                            _.flatten(
                                _.map(category_list, function (cl) {
                                    return self.pos.db.get_category_childs_ids(cl);
                                })
                            )
                        );
                        // Compatibility with pos_category_multi
                        var product_categories = [];
                        if (ol.product.pos_categ_id) {
                            product_categories = [ol.product.pos_categ_id[0]];
                        } else {
                            product_categories = ol.product.pos_category_ids;
                        }

                        if (_.intersection(category_list, product_categories).length) {
                            return memo + ol.get_price_with_tax();
                        }
                        return memo;
                    },
                    0
                ),
                this.pos.currency.rounding
            );
        },
        get_summary_for_discount_credits: function () {
            var paymentlines = this.get_paymentlines();
            return _.reduce(
                paymentlines,
                function (memo, pl) {
                    if (pl.payment_method.journal.credits_via_discount) {
                        return memo + pl.get_amount();
                    }
                    return memo;
                },
                0
            );
        },
        add_paymentline: function (cashregister) {
            this.assert_editable();
            var journal = cashregister.journal;
            if (!this.get_client() && (this.has_credit_product() || journal.debt)) {
                setTimeout(() => {
                    this.set_screen_data({name: "ClientListScreen"});
                }, 30);
            }
            var due = this.get_due_debt();
            var newPaymentline = new models.Paymentline(
                {},
                {
                    order: this,
                    cashregister: cashregister,
                    pos: this.pos,
                    payment_method: cashregister,
                }
            );
            if (cashregister.journal.debt && this.get_client()) {
                if (due < 0) {
                    newPaymentline.set_amount(due);
                } else {
                    var limits = this.get_payment_limits(cashregister, "all");
                    newPaymentline.set_amount(
                        Math.max(
                            Math.min.apply(null, _.values(limits)) -
                                this.get_summary_for_cashregister(cashregister),
                            0
                        )
                    );
                }
            } else if (due < 0) {
                newPaymentline.set_amount(due);
            } else {
                return _super_order.add_paymentline.apply(this, arguments);
            }
            this.paymentlines.add(newPaymentline);
            this.select_paymentline(newPaymentline);
            $(this.autopay_html).hide();
        },
        get_due_debt: function (paymentline) {
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
    });

    const MyPaymentScreen = (_PaymentScreen) =>
        class extends _PaymentScreen {
            constructor() {
                super(...arguments);
                this.env.pos.on(
                    "updateDebtHistory",
                    function (partner_ids) {
                        this.update_debt_history(partner_ids);
                    },
                    this
                );
            }

            update_debt_history(partner_ids) {
                // TODO: зачем это и что оно делает?
                var client = this.env.pos.get_client();
                if (client && $.inArray(client.id, partner_ids) !== -1) {
                    console.log("TODO: something must happen here");
                    // This.gui.screen_instances.products.actionpad.renderElement();
                    // this.customer_changed();
                }
            }

            async validateOrder(isForceValidate) {
                var currentOrder = this.currentOrder;
                var zero_paymentlines = _.filter(
                    currentOrder.get_paymentlines(),
                    function (p) {
                        return p.amount === 0;
                    }
                );
                _.each(zero_paymentlines, function (p) {
                    currentOrder.remove_paymentline(p);
                });
                var isDebt = currentOrder.updates_debt();
                var debt_amount = currentOrder.get_debt_delta();
                var client = currentOrder.get_client();
                if (client) {
                    currentOrder.debt_before = client.debt;
                    currentOrder.debt_after = currentOrder.debt_before + debt_amount;
                } else {
                    currentOrder.debt_before = false;
                    currentOrder.debt_after = false;
                }
                if (isDebt && !client) {
                    this.showPopup("ErrorPopup", {
                        title: _t("Unknown customer"),
                        body: _t("You cannot use Debt payment. Select customer first."),
                    });
                    return;
                }
                var paymentlines_with_credits_via_discounts = currentOrder.has_paymentlines_with_credits_via_discounts();
                if (paymentlines_with_credits_via_discounts.length) {
                    var paymentlines_with_credits_via_discounts_text = _.map(
                        paymentlines_with_credits_via_discounts,
                        function (pl) {
                            return pl.name;
                        }
                    ).join(", ");

                    if (this.check_discount_credits_for_taxed_products()) {
                        this.showPopup("ErrorPopup", {
                            title: _t(
                                "Unable to validate with the " +
                                    paymentlines_with_credits_via_discounts_text +
                                    " payment method"
                            ),
                            body: _t(
                                "You cannot use " +
                                    paymentlines_with_credits_via_discounts_text +
                                    " for products with taxes. Use an another payment method, or pay the full price with only discount credits"
                            ),
                        });
                        return;
                    }
                    if (currentOrder.has_credit_product()) {
                        this.showPopup("ErrorPopup", {
                            title: _t(
                                "Unable to validate with the " +
                                    paymentlines_with_credits_via_discounts_text +
                                    " payment method"
                            ),
                            body: _t(
                                "You cannot use " +
                                    paymentlines_with_credits_via_discounts_text +
                                    " for credit top-up products. Use an another non-discount payment method"
                            ),
                        });
                        return;
                    }
                }
                if (
                    !currentOrder.get_paymentlines().length &&
                    currentOrder.has_return_product()
                ) {
                    this.showPopup("ErrorPopup", {
                        title: _t("Unable to validate return order"),
                        body: _t("Specify Payment Method"),
                    });
                    return;
                }
                if (currentOrder.has_credit_product() && !client) {
                    this.showPopup("ErrorPopup", {
                        title: _t("Unknown customer"),
                        body: _t("Don't forget to specify Customer when sell Credits."),
                    });
                    return;
                }
                if (isDebt && currentOrder.get_orderlines().length === 0) {
                    this.showPopup("ErrorPopup", {
                        title: _t("Empty Order"),
                        body: _t(
                            "There must be at least one product in your order before it can be validated. (Hint: you can use some dummy zero price product)"
                        ),
                    });
                    return;
                }
                var exceeding_debts = this.exceeding_debts_check();
                if (client && exceeding_debts) {
                    this.showPopup("ErrorPopup", {
                        title: _t("Max Debt exceeded"),
                        body: _t(
                            "You cannot sell products on credit journal " +
                                exceeding_debts +
                                " to the customer because its max debt value will be exceeded."
                        ),
                    });
                    return;
                }
                if (this.debt_change_check()) {
                    this.showPopup("ErrorPopup", {
                        title: _t(
                            "Unable to return the change or cash out with the debt payment method"
                        ),
                        body: _t(
                            "Please enter the exact or lower debt amount than the cost of the order."
                        ),
                    });
                    return;
                }
                var violations = this.debt_journal_restricted_categories_check();
                if (violations.length) {
                    this.showPopup("ErrorPopup", {
                        title: _t("Unable to validate with the debt payment method"),
                        body: _t(this.restricted_categories_message(violations)),
                    });
                    return;
                }
                await super.validateOrder(isForceValidate);
            }

            async _finalizeValidation() {
                var self = this;
                var order = this.currentOrder,
                    paymentlines = order.get_paymentlines(),
                    partner = this.currentOrder.get_client();
                var debt_pl = _.filter(paymentlines, function (pl) {
                    return pl.payment_method.journal.debt;
                });
                if (debt_pl.length && partner) {
                    await super._finalizeValidation();
                    // Offline updating of credits, on a restored network this data will be replaced by the servers one
                    _.each(debt_pl, function (pl) {
                        partner.debts[pl.payment_method.journal.id].balance -=
                            pl.amount;
                        partner.debt += pl.amount;
                    });
                } else {
                    await super._finalizeValidation();
                }
                var debt_prod = _.filter(order.get_orderlines(), function (ol) {
                    return ol.product.credit_product;
                });
                if (debt_prod) {
                    var value = 0;
                    _.each(debt_prod, function (dp) {
                        value = round_pr(
                            dp.quantity * dp.price,
                            self.pos.currency.rounding
                        );
                        partner.debts[dp.product.credit_product[0]].balance += value;
                        partner.debt -= value;
                    });
                }
            }

            get_used_debt_cashregisters(paymentlines) {
                paymentlines = paymentlines || this.currentOrder.get_paymentlines();
                var cashregisters = _.uniq(
                    _.map(paymentlines, function (pl) {
                        return pl.payment_method;
                    })
                );
                return _.filter(cashregisters, function (cr) {
                    return cr.journal.debt;
                });
            }

            restricted_categories_message(cashregisters) {
                var self = this;
                var body = [];
                var categ_names = [];
                _.each(cashregisters, function (cr) {
                    var journal = cr.journal;
                    _.each(journal.category_ids, function (categ) {
                        categ_names.push(self.pos.db.get_category_by_id(categ).name);
                    });
                    body.push(
                        categ_names.join(", ") + " with " + cr.journal_id[1] + " "
                    );
                });
                // TODO we can make a better formatting here
                return "You may only buy " + body.toString();
            }

            debt_journal_restricted_categories_check() {
                var self = this;
                var cashregisters = this.get_used_debt_cashregisters();
                cashregisters = _.filter(cashregisters, function (cr) {
                    return cr.journal.category_ids.length > 0;
                });
                var violations = [];
                _.each(cashregisters, function (cr) {
                    if (self.restricted_products_check(cr)) {
                        violations.push(cr);
                    }
                });
                return violations;
            }

            check_discount_credits_for_taxed_products() {
                var order = this.currentOrder,
                    discount_pl = order.has_paymentlines_with_credits_via_discounts();
                if (
                    !discount_pl.length ||
                    discount_pl.length === order.get_paymentlines().length
                ) {
                    return false;
                }
                var taxes_id = false;
                var taxed_orderlines = _.find(order.orderlines.models, function (ol) {
                    // Returns only a found orderline with a tax that is not included in the price
                    taxes_id = ol.product.taxes_id;
                    if (taxes_id && taxes_id.length) {
                        return _.find(taxes_id, function (t) {
                            return !order.pos.taxes_by_id[t].price_include;
                        });
                    }
                    return false;
                });
                if (!taxed_orderlines) {
                    return false;
                }
                return true;
            }

            restricted_products_check(cr) {
                var order = this.pos.get_order();
                var sum_pl = round_pr(
                    order.get_summary_for_cashregister(cr),
                    this.pos.currency.rounding
                );
                var limits = order.get_payment_limits(cr, "products_restriction");
                var allowed_lines = _.filter(order.get_orderlines(), function (ol) {
                    var categories = [];
                    if (ol.product.pos_categ_id) {
                        categories = [ol.product.pos_categ_id[0]];
                    } else {
                        categories = ol.product.pos_category_ids;
                    }
                    if (_.intersection(cr.journal.category_ids, categories).length) {
                        return true;
                    }
                    return false;
                });
                if (
                    allowed_lines.length === order.get_orderlines().length ||
                    this.cash_out_check()
                ) {
                    // If all products are allowed or it is a cash out case
                    // we don't need to check max debt exceeding, because it was checked earlier
                    return false;
                }
                if (
                    _.has(limits, "products_restriction") &&
                    sum_pl > limits.products_restriction
                ) {
                    return cr;
                }
                return false;
            }

            cash_out_check() {
                var order = this.pos.get_order();
                if (
                    order.get_orderlines().length === 1 &&
                    this.pos.config.debt_dummy_product_id &&
                    order.get_orderlines()[0].product.id ===
                        this.pos.config.debt_dummy_product_id[0]
                ) {
                    return true;
                }
                return false;
            }

            exceeding_debts_check() {
                var order = this.currentOrder,
                    flag = false;
                if (this.env.pos.get_client()) {
                    _.each(this.get_used_debt_cashregisters(), function (cr) {
                        var limits = order.get_payment_limits(cr, "debt_limit");
                        var sum_pl = order.get_summary_for_cashregister(cr);
                        // No need to check that debt_limit is in limits by the reason of get_payment_limits definition
                        if (sum_pl > limits.debt_limit) {
                            flag = cr.cash_journal_id[1];
                        }
                    });
                    return flag;
                }
            }

            debt_change_check() {
                var order = this.currentOrder,
                    paymentlines = order.get_paymentlines();
                for (var i = 0; i < paymentlines.length; i++) {
                    var journal = paymentlines[i].payment_method.journal;
                    if (
                        journal.debt &&
                        !journal.pos_cash_out &&
                        order.get_change(paymentlines[i]) > 0
                    ) {
                        return true;
                    }
                }
                return false;
            }

            payFullDebt() {
                var order = this.currentOrder;
                if (
                    order &&
                    !order.orderlines.length &&
                    this.env.pos.config.debt_dummy_product_id
                ) {
                    order.add_product(
                        this.env.pos.db.get_product_by_id(
                            this.env.pos.config.debt_dummy_product_id[0]
                        ),
                        {price: 0}
                    );
                }

                var paymentLines = order.get_paymentlines();
                if (paymentLines.length) {
                    _.each(paymentLines, function (paymentLine) {
                        if (paymentLine.payment_method.journal.debt) {
                            paymentLine.destroy();
                        }
                    });
                }

                var debts = order.get_client().debts;
                _.each(debts, (debt) => {
                    if (debt.balance < 0) {
                        var newDebtPaymentline = new models.Paymentline(
                            {},
                            {
                                pos: this.env.pos,
                                order: order,
                                payment_method: _.find(
                                    this.env.pos.payment_methods,
                                    function (cr) {
                                        return cr.journal.id === debt.journal_id[0];
                                    }
                                ),
                            }
                        );
                        newDebtPaymentline.set_amount(debt.balance);
                        order.paymentlines.add(newDebtPaymentline);
                    }
                });

                this.render();
            }

            get isPayFullDebtButtonVisible() {
                var debt = 0;
                var client = this.env.pos.get_client();
                // Var debt_type = this.env.pos.config.debt_type;
                if (client) {
                    debt = Math.round(client.debt * 100) / 100;
                    return debt > 0;
                }
                return false;
            }

            customer_changed_() {
                // Продолжение с isPayFullDebtButtonVisible()
                this.change_autopay_button();
            }

            add_autopay_paymentlines() {
                var client = this.pos.get_client();
                var order = this.pos.get_order();
                var status = "";
                if (
                    client &&
                    client.debts &&
                    order &&
                    order.get_orderlines().length !== 0 &&
                    !order.has_credit_product()
                ) {
                    var paymentlines = order.get_paymentlines();
                    if (paymentlines.length && order.get_due() > 0) {
                        _.each(paymentlines, function (pl) {
                            order.remove_paymentline(pl);
                        });
                    }
                    var autopay_cashregisters = _.filter(
                        this.pos.payment_methods,
                        function (cr) {
                            return (
                                cr.journal.debt &&
                                cr.journal.credits_autopay &&
                                client.debts[cr.journal.id].balance > 0
                            );
                        }
                    );
                    if (autopay_cashregisters) {
                        _.each(autopay_cashregisters, function (cr) {
                            if (order.get_due()) {
                                order.add_paymentline(cr);
                            }
                        });
                        status = "validate";
                    }
                    if (order.get_due() > 0) {
                        status = "alert";
                    }
                }
                return status;
            }

            async click_autopay_validation() {
                this.currentOrder.isAutopayValidated = true;
                await this.validateOrder();
            }

            showScreen(name, props) {
                props = props || {};
                props.isAutopayValidated = this.currentOrder.isAutopayValidated;
                return super.showScreen(name, props);
            }

            show() {
                var autopay_status = this.add_autopay_paymentlines();
                this._super();
                this.change_autopay_button(autopay_status);
            }
        };

    Registries.Component.extend(PaymentScreen, MyPaymentScreen);

    const MyClientListScreen = (_ClientListScreen) =>
        class extends _ClientListScreen {
            constructor() {
                super(...arguments);
                this.env.pos.on(
                    "updateDebtHistory",
                    (partner_ids) => this.render(),
                    this
                );
                this.debt_history_limit_initial = 10;
                this.debt_history_limit_increment = 10;
                this.state.isShowingDebtHistory = false;
                this.state.isLoadingDebtHistory = false;
                // TODO: надо следить, если поменяли клиента, то массив ниже должен быть обнулен, как срок Путина
                this.state.selectedClientDebtHistory = [];
            }

            clickClient(event) {
                super.clickClient(event);
                if (this.state.selectedClient) {
                    this.env.pos.reload_debts(this.state.selectedClient.id, 0, {
                        postpone: false,
                    });
                }
            }

            clickLoadMoreDebtHistory() {
                this.loadDebtHistory(
                    this.state.selectedClientDebtHistory.length +
                        this.debt_history_limit_increment
                );
            }

            showDebtHistory(event) {
                this.state.isShowingDebtHistory = true;
                this.loadDebtHistory(this.debt_history_limit_initial);
            }

            showCustomers(event) {
                this.state.isShowingDebtHistory = false;
                this.render();
            }

            loadDebtHistory(limit) {
                this.state.isLoadingDebtHistory = true;
                this.env.pos
                    .reload_debts(this.state.selectedClient.id, limit, {
                        postpone: false,
                    })
                    .then(() => {
                        // TODO: check if this.state.selectedClient.id is the same as before executing reload_debts
                        var partner = this.state.selectedClient;
                        var sign = this.env.pos.config.debt_type === "credit" ? -1 : 1;
                        var debt_history = partner.history || [];

                        var total_balance = partner.debt;
                        for (var i = 0; i < debt_history.length; i++) {
                            debt_history[i].total_balance =
                                (sign * Math.round(total_balance * 100)) / 100;
                            total_balance += debt_history[i].balance;
                        }

                        var cashregisters = _.filter(
                            this.env.pos.payment_methods,
                            function (cr) {
                                return cr.journal.debt;
                            }
                        );

                        _.each(cashregisters, function (cr) {
                            var journal_id = cr.journal.id;
                            var total_journal = partner.debts[journal_id].balance;
                            for (i = 0; i < debt_history.length; i++) {
                                if (debt_history[i].journal_id[0] === journal_id) {
                                    debt_history[i].total_journal =
                                        Math.round(total_journal * 100) / 100;
                                    total_journal -= debt_history[i].balance;
                                }
                            }
                        });

                        this.state.selectedClientDebtHistory = debt_history;
                        this.state.isLoadingDebtHistory = false;
                        this.render();
                    });
                // TODO: перенеси эту логику:
                // if (this.debt_history_is_opened() && !this.editing_client) {
                //     this.$el.find(".client-details").addClass("debt-history");
                // } else {
                //     this.$el.find(".client-details").removeClass("debt-history");
                // }
                this.render();
            }

            payFullDebt() {
                var client = this.state.selectedClient;
                if (client.debt <= 0) {
                    this.showPopup("ErrorPopup", {
                        title: _t("Error: No Debt"),
                        body: _t("The selected customer has no debt."),
                    });
                    return;
                }
                // If the order is empty, add a dummy product with price = 0
                var order = this.env.pos.get_order();
                if (order) {
                    var lastorderline = order.get_last_orderline();
                    if (
                        lastorderline === null &&
                        this.env.pos.config.debt_dummy_product_id
                    ) {
                        var dummy_product = this.env.pos.db.get_product_by_id(
                            this.env.pos.config.debt_dummy_product_id[0]
                        );
                        order.add_product(dummy_product, {price: 0});
                    }
                }

                // Select debt journal
                var debtjournal = false;
                _.each(this.env.pos.payment_methods, function (cashregister) {
                    if (cashregister.journal.debt) {
                        debtjournal = cashregister;
                    }
                });

                // Add payment line with amount = debt *-1
                var paymentLines = order.get_paymentlines();
                if (paymentLines.length) {
                    /* Delete existing debt line
                    Usefull for the scenario where a customer comes to
                    pay his debt and the user clicks on the "Debt journal"
                    which opens the partner list and then selects partner
                    and clicks on "Select Customer and Pay Full Debt" */
                    _.each(paymentLines.models, function (paymentLine) {
                        if (paymentLine.payment_method.journal.debt) {
                            paymentLine.destroy();
                        }
                    });
                }

                var newDebtPaymentline = new models.Paymentline(
                    {},
                    {order: order, payment_method: debtjournal, pos: this.env.pos}
                );
                newDebtPaymentline.set_amount(client.debt * -1);
                order.paymentlines.add(newDebtPaymentline);

                this.props.resolve({confirmed: true, payload: client});
                this.showScreen("PaymentScreen");
                this.trigger("close-temp-screen");
            }

            async saveChanges(event) {
                await super.saveChanges(event);
                this.env.pos.reload_debts([this.state.selectedClient.id], 0, {
                    postpone: false,
                });
            }
        };

    Registries.Component.extend(ClientListScreen, MyClientListScreen);

    class ThumbUpPopup extends AbstractAwaitablePopup {
        mounted() {
            var random = Math.random();
            var element = $(".icon-wrapper");
            if (random <= 0.01) {
                element = $(".icon-wrapper-2");
            }
            element.parents(".thumb-up-popup").css({
                "line-height": document.documentElement.clientHeight + "px",
            });
            var k = 50;
            element.css({
                zoom:
                    k *
                        (Math.min(
                            document.documentElement.clientWidth,
                            document.documentElement.clientHeight
                        ) /
                            80) +
                    "%",
            });

            element.show();
            element.addClass("anim");

            setTimeout(() => {
                element.removeClass("anim");
                element.hide();
                this.cancel();
            }, 1000);
        }
    }

    ThumbUpPopup.template = "ThumbUpPopupWidget";
    ThumbUpPopup.defaultProps = {};

    Registries.Component.add(ThumbUpPopup);
});
