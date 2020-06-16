/*  Copyright 2018 Artyom Losev
    Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
    Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
    License MIT (https://opensource.org/licenses/MIT).*/

odoo.define("pos_expenses_pay.pos", function(require) {
    "use strict";
    var screens = require("point_of_sale.screens");
    var models = require("point_of_sale.models");
    var gui = require("point_of_sale.gui");
    var PosDB = require("point_of_sale.DB");
    var core = require("web.core");
    var PopupWidget = require("point_of_sale.popups");
    var rpc = require("web.rpc");

    var QWeb = core.qweb;
    var _t = core._t;

    var _super_pos_model = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function() {
            _super_pos_model.initialize.apply(this, arguments);
            this.bus.add_channel_callback(
                "pos_expenses",
                this.on_expenses_updates,
                this
            );
            this.subscribers = [];
        },

        add_subscriber: function(subscriber) {
            this.subscribers.push(subscriber);
        },

        on_expenses_updates: function(message) {
            var self = this;
            message.updated_expenses.forEach(function(id) {
                self.fetch_expense_sheet_by_id(id).done(function(expense) {
                    self.update_expenses(expense);
                });
            });
        },

        fetch_expense_sheet_by_id: function(id) {
            return rpc.query({
                model: "hr.expense.sheet",
                method: "read",
                args: [id],
            });
        },

        get_expense_by_id: function(id) {
            return this.db.expenses_by_id[id];
        },

        update_expenses: function(expense) {
            var self = this,
                max = this.db.expenses.length,
                expenses_to_update = [];
            expense = expense[0];
            for (var i = 0; i < max; i++) {
                if (expense.id === this.db.expenses[i].id) {
                    this.db.expenses.splice(i, 1);
                    expenses_to_update.push(expense.id);
                    break;
                }
            }
            delete this.get_expense_by_id(expense.id);
            var def = $.Deferred();
            if (
                (expense.state === "post" || expense.state === "approve") &&
                !expense.pos_session_id
            ) {
                this.db.expenses.unshift(expense);
                this.db.expenses_by_id[expense.id] = expense;
                if (!this.get_expense_by_id(expense.id).expense_lines) {
                    this.get_expense_by_id(expense.id).expense_lines = [];
                    this.fetch_expense_lines([expense.id]).then(function(res) {
                        self.set_expense_lines(res);
                        def.resolve();
                    });
                }
            } else {
                def.resolve();
            }
            $.when(def).done(function() {
                self.publish_db_updates(expenses_to_update);
            });
        },

        publish_db_updates: function(ids) {
            _.each(this.subscribers, function(subscriber) {
                var callback = subscriber.callback,
                    context = subscriber.context;
                callback.call(context, "update", ids);
            });
        },

        fetch_expense_lines: function(expense_sheet_ids) {
            return rpc.query({
                model: "hr.expense",
                method: "search_read",
                args: [],
                domain: [["sheet_id", "in", expense_sheet_ids]],
            });
        },

        set_expense_lines: function(lines) {
            var sheet_id = 0;
            for (var i = 0; i < lines.length; i++) {
                sheet_id = lines[i].sheet_id[0];
                var line_ids = _.pluck(
                    this.get_expense_by_id(sheet_id).expense_lines,
                    "id"
                );
                if (!_.contains(line_ids, lines[i].id)) {
                    this.get_expense_by_id(sheet_id).expense_lines.push(lines[i]);
                }
            }
        },
    });

    models.load_models({
        model: "hr.expense.sheet",
        fields: [],
        domain: function(self) {
            var domain = [
                ["payment_mode", "=", "own_account"],
                ["state", "in", ["post", "approve"]],
            ];
            return domain;
        },

        loaded: function(self, expenses) {
            var expense_sheet_ids = [];
            self.db.expenses = expenses;

            self.db.expenses.forEach(function(expense) {
                self.db.expenses_by_id[expense.id] = expense;
                self.db.expenses_by_id[expense.id].expense_lines = [];
            });

            expense_sheet_ids = _.pluck(self.db.expenses, "id");
            self.fetch_expense_lines(expense_sheet_ids).then(function(expense_lines) {
                self.set_expense_lines(expense_lines);
            });
        },
    });

    PosDB.include({
        init: function(options) {
            this.expenses = [];
            this.expenses_by_id = {};
            this._super.apply(this, arguments);
        },
    });

    var ExpensesButton = screens.ActionButtonWidget.extend({
        template: "ExpensesButton",
        button_click: function() {
            var self = this;
            if (this.pos.db.expenses.length) {
                self.gui
                    .select_user({
                        security: true,
                        current_user: self.pos.get_cashier(),
                        title: _t("Change Cashier"),
                    })
                    .then(function(user) {
                        self.pos.set_cashier(user);
                        self.gui.chrome.widget.username.renderElement();
                        self.gui.show_screen("expenses_screen");
                    });
            } else {
                self.gui.show_popup("error", {
                    title: _t("No Expenses"),
                    body: _t("There are no payable expenses."),
                });
            }
        },
    });

    screens.define_action_button({
        name: "expenses_button",
        widget: ExpensesButton,
        condition: function() {
            return this.pos.config.pay_expenses;
        },
    });

    var ExpensesScreenWidget = screens.ScreenWidget.extend({
        template: "ExpensesScreenWidget",
        auto_back: true,

        init: function(parent, options) {
            this._super(parent, options);
            this.selected_expense = false;
            this.subscribe();
        },

        subscribe: function() {
            var subscriber = {
                context: this,
                callback: this.recieve_updates,
            };
            this.pos.add_subscriber(subscriber);
        },

        show: function() {
            var self = this;
            this._super();
            this.clear_list_widget();

            this.$(".back").click(function() {
                self.gui.show_screen("products");
            });

            var expenses = this.pos.db.expenses;
            this.render_list(expenses);

            this.$(".expenses-list-contents").delegate(".order-line", "click", function(
                event
            ) {
                event.stopImmediatePropagation();
                self.line_select(event, $(this), parseInt($(this).data("id"), 10));
            });

            this.$(".next").click(function() {
                if (!self.selected_expense) {
                    return;
                }
                self.process_expense(self.selected_expense);
            });
        },

        clear_list_widget: function() {
            this.$(".order-line").removeClass("active");
            this.$(".order-line").removeClass("highlight");
            this.selected_expense = false;
            this.hide_select_button();
        },

        render_list: function(expenses) {
            var contents = this.$el[0].querySelector(".expenses-list-contents");
            contents.innerHTML = "";
            for (var i = 0, len = Math.min(expenses.length, 1000); i < len; i++) {
                var expenseline = false;
                var expenseline_html = QWeb.render("ExpensesList", {
                    widget: this,
                    order: expenses[i],
                });
                var lines_table = expenses[i].expense_lines
                    ? this.render_lines_table(expenses[i])
                    : document.createElement("tr");

                expenseline = document.createElement("tbody");
                expenseline.innerHTML = expenseline_html;
                expenseline = expenseline.childNodes[1];

                contents.appendChild(expenseline);
                contents.appendChild(lines_table);
            }
        },

        render_lines_table: function(expense) {
            var lines_table_html = QWeb.render("ExpensesLinesTable", {
                widget: this,
                order: expense,
            });
            var lines_table = document.createElement("table");
            lines_table.classList.add("lines-table");
            lines_table.innerHTML = lines_table_html;

            var $tr = document.createElement("tr");
            $tr.classList.add("line-element-hidden");
            $tr.classList.add("line-element-container");

            var $td = document.createElement("td");
            $td.setAttribute("colspan", 4);
            $td.appendChild(lines_table);
            $tr.appendChild($td);
            return $tr;
        },

        line_select: function(event, $line, id) {
            this.$(".order-line")
                .not($line)
                .removeClass("active");
            this.$(".order-line")
                .not($line)
                .removeClass("highlight");
            this.$(".line-element-container").addClass("line-element-hidden");
            if ($line.hasClass("active")) {
                $line.removeClass("active");
                $line.removeClass("highlight");
                this.hide_select_button();
                this.hide_order_details($line);
                this.selected_expense = false;
            } else {
                $line.addClass("active");
                $line.addClass("highlight");
                this.show_select_button();
                this.show_order_details($line);
                this.selected_expense = this.pos.get_expense_by_id(id);
            }
        },

        hide_order_details: function($line) {
            $line.next().addClass("line-element-hidden");
        },

        show_order_details: function($line) {
            $line.next().removeClass("line-element-hidden");
        },

        process_expense: function(expense) {
            var payment_mode = _t("Employee (to reimburse)");
            if (expense.payment_mode === "company_account") {
                payment_mode = _t("Company");
            }
            this.gui.show_popup("expenses-popup", {
                title: _t("Pay Expense"),
                payment_mode: payment_mode,
                expense_id: expense.id,
                body: _t(
                    "Pay expense in " +
                        this.format_currency(expense.total_amount) +
                        " to " +
                        expense.employee_id[1]
                ),
            });
        },

        hide_select_button: function() {
            this.$(".next").addClass("line-element-hidden");
        },

        show_select_button: function() {
            this.$(".next").removeClass("line-element-hidden");
        },

        recieve_updates: function(action, ids) {
            switch (action) {
                case "update":
                    if (this.gui.current_screen === this) {
                        this.show();
                    }
                    break;
                default:
                    break;
            }
        },
    });

    gui.define_screen({name: "expenses_screen", widget: ExpensesScreenWidget});

    var ExpensesWidget = PopupWidget.extend({
        template: "ExpensesWidget",
        init: function(parent, args) {
            this._super(parent, args);
            this.options = {};
        },

        click_confirm: function() {
            var expense_id = this.options.expense_id;
            var expense = this.pos.get_expense_by_id(expense_id);
            if (!expense.journal_id) {
                return this.gui.show_popup("error", {
                    title: _t("Error"),
                    body: _t(
                        "Expenses must have an expense journal specified to generate accounting entries."
                    ),
                });
            }
            var self = this,
                cashier = this.pos.get_cashier(),
                session_id = this.pos.pos_session.id;
            rpc.query({
                model: "hr.expense.sheet",
                method: "process_expense_from_pos",
                args: [expense_id, cashier.name, session_id],
            })
                .then(function(res) {
                    self.gui.close_popup();
                    self.gui.show_screen("products");
                })
                .fail(function(type, error) {
                    self.gui.show_popup("error", {
                        title: _t(error.message),
                        body: _t(type.data.arguments[0]),
                    });
                    event.preventDefault();
                });
        },
    });

    gui.define_popup({name: "expenses-popup", widget: ExpensesWidget});
});
