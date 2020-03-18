/* Copyright 2016-2017 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
 * Copyright 2016 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * License MIT (https://opensource.org/licenses/MIT). */
/* eslint-disable */

function testInject() {
    console.log("code is injected!");
    return 1;
}

window.mstest = {
    is_wait: false,
    _rand: function($list) {
        return $list.eq(Math.floor(Math.random() * $list.length));
    },
    gc: function() {
        url = "/pos_multi_session/test/gc";
        $.ajax(url)
            .done(function(res) {
                if (res && res.error) {
                    console.log("error", "error on GC");
                }
            })
            .fail(function() {
                console.log("error", "cannot call GC");
            });
    },
    remove_all_orders: function() {
        var orders = $(".select-order").length;
        while (orders > 1) {
            this.remove_current_order();
            orders = $(".select-order").length;
        }
        if (orders == 1) {
            this.remove_current_order();
        }
    },
    remove_current_order: function() {
        $(".deleteorder-button").click();
        $(".confirm:visible").click();
    },
    add_random_product: function() {
        this._rand($(".product")).click();
        this.close_popup();
    },
    close_popup: function() {
        // close popup with error if any
        $(".modal-dialog button.cancel:visible").click();
    },
    fill_order: function() {
        this.add_random_product();
        this.add_random_product();
    },
    new_order: function() {
        this.close_popup();
        $(".neworder-button").click();
    },
    get_order: function() {
        lines = [];
        $(".orderline").each(function() {
            lines.push({
                name: $.trim(
                    $(this)
                        .find(".product-name")
                        .text()
                ),
                price: $.trim(
                    $(this)
                        .find(".price")
                        .text()
                ),
                qty: $.trim(
                    $(this)
                        .find(".info em")
                        .text()
                ),
            });
        });
        order = {
            lines: lines,
            order_num: parseInt(
                $(".order-button.select-order.selected .order-sequence")
                    .text()
                    .split("\n")[3]
            ),
        };
        return order;
    },
    print_order: function() {
        order = this.get_order();
        console.log("Order", JSON.stringify(order));
    },
    switch_to_order: function(order) {
        $(".order-sequence").each(function() {
            var order_num = $.trim($(this).html()).split("\n");
            if (parseInt(order_num[2]) == order.order_num) {
                if (
                    !$(this)
                        .parent()
                        .hasClass("selected")
                ) {
                    // click only on inactive tab.
                    // Otherwise Customer Selection screen will be opened
                    $(this).click();
                }
                return false;
            }
        });
    },
    find_order: function(order) {
        this.switch_to_order(order);
        found = this.get_order();
        if (JSON.stringify(order) !== JSON.stringify(found)) {
            console.log("Expected Order", JSON.stringify(order));
            console.log("Found Order", JSON.stringify(found));
            console.log("error", "Synced orders are mismatched");
        }
        return found;
    },
    order_exists: function(order) {
        this.switch_to_order(order);
        found = this.get_order();
        return order.order_num == found.order_num;
    },
    check_inclusion: function(small, big) {
        // check that order "big" includes order "small"
        included = true;
        if (small.order_num != big.order_num) {
            console.log(
                "error",
                "Order nums are mismatched",
                small.order_num,
                big.order_num
            );
        }
        _.each(small.lines, function(small_line) {
            big_line = _.find(big.lines, function(line) {
                return line.name == small_line.name;
            });
            if (!big_line) {
                included = false;
            } else if (parseInt(big_line.qty) < parseInt(small_line.qty)) {
                included = false;
            }
        });
        if (!included) {
            console.log("Small Order", JSON.stringify(small));
            console.log("Big Order", JSON.stringify(big));
            console.log("error", "Order lines are lost");
        }
    },
    wait: function(callback, timeout) {
        mstest.is_wait = true;
        setTimeout(function() {
            callback();
            mstest.is_wait = false;
        }, timeout || 3000);
    },
    check_revision_error: function() {
        warning_message =
            "There is a conflict during synchronization, try your action again";
        if (
            $(".popup-error > p.body")
                .text()
                .indexOf(warning_message) !== -1
        ) {
            console.log("error", warning_message);
        }
    },
};
