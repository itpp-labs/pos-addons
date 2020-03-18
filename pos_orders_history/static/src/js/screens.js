/* Copyright 2017-2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Artem Losev
 * Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License MIT (https://opensource.org/licenses/MIT). */
/* eslint-disable no-useless-escape */
odoo.define("pos_orders_history.screens", function(require) {
    "use strict";
    var screens = require("point_of_sale.screens");
    var gui = require("point_of_sale.gui");
    var core = require("web.core");
    var QWeb = core.qweb;
    var Model = require("web.Model");
    var PopupWidget = require("point_of_sale.popups");
    var _t = core._t;

    screens.OrdersHistoryButton = screens.ActionButtonWidget.extend({
        template: "OrdersHistoryButton",
        button_click: function() {
            this.gui.show_screen("orders_history_screen");
        },
    });
    screens.define_action_button({
        name: "orders_history_button",
        widget: screens.OrdersHistoryButton,
        condition: function() {
            return this.pos.config.orders_history;
        },
    });

    screens.OrdersHistoryScreenWidget = screens.ScreenWidget.extend({
        template: "OrdersHistoryScreenWidget",
        init: function(parent, options) {
            this._super(parent, options);
            this.orders_history_cache = new screens.DomCache();
            this.filters = [];
            this.selected_order = false;
            this.subscribe();
        },
        auto_back: true,
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

            var orders = this.pos.db.get_sorted_orders_history(1000);
            this.render_list(orders);

            this.$(".filters .user-filter").click(function(e) {
                e.stopImmediatePropagation();
                self.change_filter("user", $(this));
            });

            this.$(".filters .pos-filter").click(function(e) {
                e.stopImmediatePropagation();
                self.change_filter("pos", $(this));
            });

            this.$(".filters .table-filter").click(function(e) {
                e.stopImmediatePropagation();
                self.change_filter("table", $(this));
            });

            this.$(".order-list-contents").delegate(".order-line td", "click", function(
                event
            ) {
                event.stopImmediatePropagation();
                if ($(this).hasClass("actions")) {
                    return false;
                }
                var parent = $(this).parent();
                self.line_select(event, parent, parseInt(parent.data("id"), 10));
            });

            var search_timeout = null;
            if (this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard) {
                this.chrome.widget.keyboard.connect(this.$(".searchbox input"));
            }
            this.$(".searchbox input").on("keypress", function(event) {
                clearTimeout(search_timeout);

                var query = this.value;

                search_timeout = setTimeout(function() {
                    self.perform_search(query, event.which === 13);
                }, 70);
            });

            this.$(".searchbox .search-clear").click(function() {
                self.clear_search();
            });

            this.$(".scan-barcode").click(function() {
                self.gui.show_popup("textinput", {
                    title: _t("Enter or Scan barcode"),
                    barcode: true,
                    confirm: function(barcode) {
                        self.confirm_barcode(barcode);
                    },
                });
                self.pos.barcode_reader.restore_callbacks();
            });

            if (this.pos.config.load_barcode_order_only) {
                // Open popup automatically
                this.$(".scan-barcode").click();
            }
        },
        confirm_barcode: function(barcode) {
            if (barcode) {
                this.load_order_by_barcode(barcode);
            } else {
                this.gui.show_popup("error", {
                    title: _t("No Barcode"),
                });
            }
        },
        load_order_by_barcode: function(barcode) {
            var self = this;
            new Model("pos.order")
                .call("search_read", [[["pos_history_reference_uid", "=", barcode]]])
                .then(
                    function(o) {
                        if (o && o.length) {
                            self.pos.update_orders_history(o);
                            if (o instanceof Array) {
                                o = o[0];
                            }
                            self.pos
                                .get_order_history_lines_by_order_id(o.id)
                                .done(function(lines) {
                                    self.pos.update_orders_history_lines(lines);
                                    self.search_order_on_history(o);
                                });
                        } else {
                            self.gui.show_popup("error", {
                                title: _t("Error: Could not find the Order"),
                                body: _t("There is no order with this barcode."),
                            });
                        }
                    },
                    function(err, event) {
                        event.preventDefault();
                        console.error(err);
                        self.gui.show_popup("error", {
                            title: _t("Error: Could not find the Order"),
                            body: err.data,
                        });
                    }
                );
        },
        clear_list_widget: function() {
            this.$(".order-line").removeClass("active");
            this.$(".order-line").removeClass("highlight");
            this.$(".line-element-container").addClass("line-element-hidden");
        },
        change_filter: function(filter_name, filter) {
            if (filter.hasClass("active")) {
                filter.removeClass("active");
                this.remove_active_filter(filter_name);
            } else {
                filter.addClass("active");
                this.set_active_filter(filter_name);
            }
            this.apply_filters();
        },
        remove_active_filter: function(name) {
            this.filters.splice(this.filters.indexOf(name), 1);
        },
        set_active_filter: function(name) {
            this.filters.push(name);
        },
        apply_filters: function() {
            var self = this;
            var orders = this.pos.db.get_sorted_orders_history(1000);
            this.filters.forEach(function(filter) {
                orders = self.get_orders_by_filter(filter, orders);
            });
            this.render_list(orders);
        },
        get_orders_by_filter: function(filter, orders) {
            var self = this;
            if (filter === "user") {
                var user_id = this.pos.cashier ? this.pos.cashier.id : this.pos.user.id;
                if (this.pos.cashier && this.pos.cashier.id) {
                    user_id = this.pos.cashier.id;
                }
                return orders.filter(function(order) {
                    return order.user_id[0] === user_id;
                });
            } else if (filter === "pos") {
                return orders.filter(function(order) {
                    return order.config_id[0] === self.pos.config.id;
                });
            } else if (filter === "table") {
                if (this.pos.table) {
                    return orders.filter(function(order) {
                        return order.table_id[0] === self.pos.table.id;
                    });
                }
                return orders.filter(function(order) {
                    return !order.table_id;
                });
            }
        },
        get_datetime_format: function(datetime) {
            var d = new Date(datetime);
            return new Date(
                d.getTime() - d.getTimezoneOffset() * 60000
            ).toLocaleString();
        },
        render_list: function(orders) {
            var contents = this.$el[0].querySelector(".order-list-contents");
            contents.innerHTML = "";

            for (var i = 0, len = Math.min(orders.length, 1000); i < len; i++) {
                var order = orders[i];
                var orderline = this.orders_history_cache.get_node(order.id);
                var lines_table = this.orders_history_cache.get_node(
                    order.id + "_table"
                );

                if (!orderline || !lines_table) {
                    var orderline_html = QWeb.render("OrderHistory", {
                        widget: this,
                        order: order,
                    });
                    orderline = document.createElement("tbody");
                    lines_table = document.createElement("tr");
                    var $td = document.createElement("td");

                    if (order.lines) {
                        $td.setAttribute("colspan", 8);
                    }

                    lines_table.classList.add("line-element-hidden");
                    lines_table.classList.add("line-element-container");

                    var line_data = this.get_order_line_data(order);
                    var $table = this.render_lines_table(line_data);

                    $td.appendChild($table);
                    lines_table.appendChild($td);

                    orderline.innerHTML = orderline_html;
                    orderline = orderline.childNodes[1];

                    this.orders_history_cache.cache_node(order.id, orderline);
                    this.orders_history_cache.cache_node(
                        order.id + "_table",
                        lines_table
                    );
                }

                contents.appendChild(orderline);
                contents.appendChild(lines_table);
            }
        },
        get_order_line_data: function(order) {
            var self = this;
            return _.map(order.lines, function(id) {
                var line = self.pos.db.line_by_id[id];
                line.image = self.get_product_image_url(line.product_id[0]);
                return line;
            });
        },
        render_lines_table: function(data_lines) {
            var $table = document.createElement("table"),
                $header = this.render_header(),
                $tableData = this.render_product_lines(data_lines);

            $table.classList.add("lines-table");

            $table.appendChild($header);
            $table.appendChild($tableData);
            return $table;
        },
        render_header: function() {
            var $header = document.createElement("thead");
            $header.innerHTML = QWeb.render("LinesHeader");
            return $header;
        },
        render_product_lines: function(data_lines) {
            var $body = document.createElement("tbody"),
                lines = "",
                line_html = "";
            for (var i = 0, max = data_lines.length; i < max; i++) {
                line_html = QWeb.render("LineHistory", {
                    widget: this,
                    line: data_lines[i],
                });
                lines += line_html;
            }
            $body.innerHTML = lines;
            return $body;
        },
        clear_search: function() {
            var orders = this.pos.db.pos_orders_history;
            this.render_list(orders);
            this.$(".searchbox input")[0].value = "";
            this.$(".searchbox input").focus();
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
                this.hide_order_details($line);
                this.selected_order = false;
            } else {
                $line.addClass("active");
                $line.addClass("highlight");
                this.show_order_details($line);
                // Var y = event.pageY - $line.parent().offset().top;
                this.selected_order = this.pos.db.orders_history_by_id[id];
            }
        },
        hide_order_details: function($line) {
            $line.next().addClass("line-element-hidden");
        },
        show_order_details: function($line) {
            $line.next().removeClass("line-element-hidden");
        },
        recieve_updates: function(action, ids) {
            switch (action) {
                case "update":
                    this.update_list_items(ids);
                    break;
                default:
                    break;
            }
        },
        update_list_items: function(ids) {
            var self = this;
            _.each(ids, function(id) {
                var $el = $(".order-list").find("[data-id=" + id + "]");
                var data = self.pos.db.orders_history_by_id[id];
                var selected = false;
                if ($el.length === 0 || !data) {
                    return;
                }
                var new_el_html = QWeb.render("OrderHistory", {
                    widget: self,
                    order: data,
                });
                if ($el.hasClass("active")) {
                    selected = true;
                }
                var orderline = document.createElement("tbody");
                orderline.innerHTML = new_el_html;
                orderline = orderline.childNodes[1];
                $el.replaceWith(orderline);
                self.orders_history_cache.clear_node(id);
                self.orders_history_cache.cache_node(id, orderline);
                if (selected) {
                    orderline.classList.add("active", "highlight");
                }
            });
        },
        perform_search: function(query, associate_result) {
            var orders = false;
            if (query) {
                orders = this.pos.db.search_order(query);
                this.render_list(orders);
            } else {
                orders = this.pos.db.pos_orders_history;
                this.render_list(orders);
            }
        },
        search_order_on_history: function(order) {
            this.gui.current_screen.$(".searchbox input").val(order.pos_reference);
            this.gui.current_screen.$(".searchbox input").keypress();
        },
        get_product_image_url: function(product_id) {
            return (
                window.location.origin +
                "/web/image?model=product.product&field=image_small&id=" +
                product_id
            );
        },
    });
    gui.define_screen({
        name: "orders_history_screen",
        widget: screens.OrdersHistoryScreenWidget,
    });

    screens.ScreenWidget.include({
        barcode_product_action: function(code) {
            var order = _.find(this.pos.db.get_sorted_orders_history(1000), function(
                o
            ) {
                var pos_reference =
                    o.pos_reference &&
                    o.pos_reference.match(/\d{1,}-\d{1,}-\d{1,}/g) &&
                    o.pos_reference
                        .match(/\d{1,}-\d{1,}-\d{1,}/g)[0]
                        .replace(/\-/g, "");
                return pos_reference === code.code.replace(/\-/g, "");
            });
            var screen_name = this.gui.get_current_screen();
            if (screen_name === "orders_history_screen") {
                if (order) {
                    this.gui.current_screen.search_order_on_history(order);
                    return;
                }
                var popup = this.pos.gui.current_popup;
                if (popup && popup.options.barcode) {
                    popup.$("input,textarea").val(code.code);
                    popup.click_confirm();
                } else {
                    this.gui.show_popup("error", {
                        title: _t("Error: Could not find the Order"),
                        body: _t("There is no order with this barcode."),
                    });
                }
            } else {
                this._super(code);
            }
        },
    });

    screens.ReceiptScreenWidget.include({
        render_receipt: function() {
            this._super();
            if (this.pos.config.show_barcode_in_receipt) {
                var order = this.pos.get_order();
                var receipt_reference = order.uid;
                this.$el
                    .find("#barcode")
                    .JsBarcode(receipt_reference, {format: "code128"});
                this.$el.find("#barcode").css({
                    width: "100%",
                });
            }
        },
        print_xml: function() {
            if (this.pos.config.show_barcode_in_receipt) {
                var env = {
                    widget: this,
                    pos: this.pos,
                    order: this.pos.get_order(),
                    receipt: this.pos.get_order().export_for_printing(),
                    paymentlines: this.pos.get_order().get_paymentlines(),
                };
                // TODO: print barcode via tag <barcode>
                var receipt = QWeb.render("XmlReceipt", env);
                var barcode = this.$el
                    .find("#barcode")
                    .parent()
                    .html();
                receipt = receipt.split('<img id="barcode"/>');
                receipt[0] = receipt[0] + barcode + "</img>";
                receipt = receipt.join("");
                this.pos.proxy.print_receipt(receipt);
                this.pos.get_order()._printed = true;
            } else {
                this._super();
            }
        },
    });

    PopupWidget.include({
        show: function(options) {
            var self = this;
            this._super(options);
            this.events["keypress input"] = function(event) {
                // Click Enter
                if (event.which === 13 && self.options.barcode) {
                    self.click_confirm();
                }
            };
        },
    });

    return screens;
});
