/* Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html). */
/* global posmodel*/
odoo.define("pos_inventory_adjustment.ui", function(require) {
    "use strict";

    var PopupWidget = require("point_of_sale.popups");
    var screens = require("point_of_sale.screens");
    var gui = require("point_of_sale.gui");
    var Model = require("web.DataModel");
    var core = require("web.core");
    var _t = core._t;

    var NewStageButton = screens.ActionButtonWidget.extend({
        template: "NewStageButton",
        button_click: function() {
            var pos = this.pos;
            this.gui.show_popup("invadjnew", {
                title: _t("New Stage"),
                confirm: function(data) {
                    return new Model("stock.inventory.stage")
                        .call("create", [data])
                        .then(
                            function(res) {
                                return pos
                                    .get_inventory_stages([res])
                                    .then(function(stage) {
                                        var order = pos.get_order();
                                        if (order.inventory_adjustment_stage_id) {
                                            return pos.create_inventory_order(
                                                stage,
                                                {}
                                            );
                                        }
                                        stage = stage[0];
                                        order.inventory_adjustment_stage_id = stage.id;
                                        order.inventory_adjustment_stage_name =
                                            stage.name;
                                        pos.gui.screen_instances.products.product_categories_widget.renderElement();
                                    });
                            },
                            function(err) {
                                console.log(err);
                            }
                        );
                },
                cancel: function() {
                    this.gui.close_popup();
                },
            });
        },
    });
    screens.define_action_button({
        name: "new_stage_button",
        widget: NewStageButton,
        condition: function() {
            return this.pos.config.inventory_adjustment;
        },
    });

    var UpdateStageButton = screens.ActionButtonWidget.extend({
        template: "UpdateStageButton",
        button_click: function() {
            var pos = this.pos;
            pos.get_inventory_stages().then(function(list) {
                pos.gui.show_popup("invadj", {
                    title: _t("Select Inventory Stage"),
                    list: list,
                    confirm: function(inv) {
                        var order = _.find(posmodel.get_order_list(), function(o) {
                            return o.inventory_adjustment_stage_id === inv.id;
                        });
                        if (order) {
                            return pos.set_order(order);
                        }
                        pos.get_inventory_stage_lines(inv.line_ids).then(function(
                            lines
                        ) {
                            pos.create_inventory_order(inv, {
                                inv_adj_lines: lines,
                            });
                        });
                    },
                    cancel: function() {
                        pos.gui.close_popup();
                    },
                });
            });
        },

        check_order_presence: function(inv_id) {
            // Do nothing
        },
    });
    screens.define_action_button({
        name: "update_stage_button",
        widget: UpdateStageButton,
        condition: function() {
            return this.pos.config.inventory_adjustment;
        },
    });

    var InventorySelectionPopupWidget = PopupWidget.extend({
        template: "InventorySelectionPopupWidget",
        show: function(options) {
            options = options || {};
            this._super(options);

            this.list = options.list || [];
            this.renderElement();
        },

        click_item: function(event) {
            this.gui.close_popup();
            if (this.options.confirm) {
                var item = this.list[parseInt($(event.target).data("item-index"), 10)];
                this.options.confirm.call(self, item);
            }
        },
    });
    gui.define_popup({name: "invadj", widget: InventorySelectionPopupWidget});

    var NewInventoryPopupWidget = PopupWidget.extend({
        template: "NewInventoryPopupWidget",
        show: function(options) {
            options = options || {};
            var self = this;
            this._super(options);

            this.list = options.list || [];
            this.renderElement();

            this.$el.find("select").on("change", function() {
                var selections = self.$el.find("select");
                var take_text = function(el) {
                    return el.options[el.selectedIndex].text;
                };
                self.$el
                    .find("input.name")
                    .val(take_text(selections[0]) + "-" + take_text(selections[1]));
            });
        },

        click_confirm: function(event) {
            var data = {
                inventory_id: parseInt(this.$el.find("select.inventory").val(), 10),
                user_id: parseInt(this.$el.find("select.user").val(), 10),
                name: this.$el.find("input.name").val(),
                note: this.$el.find("input.note").val(),
            };
            if (!data.inventory_id) {
                return this.gui.show_popup("error", {
                    title: _t("Error: Could not Save Changes"),
                    body: "Unable to proceed with unselected inventory",
                });
            }
            if (!data.name) {
                return this.gui.show_popup("error", {
                    title: _t("Error: Could not Save Changes"),
                    body: "Unable to proceed without any name",
                });
            }
            this.gui.close_popup();
            if (this.options.confirm) {
                this.options.confirm.call(self, data);
            }
        },
    });
    gui.define_popup({name: "invadjnew", widget: NewInventoryPopupWidget});

    screens.ActionpadWidget.include({
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);

            this.pos.bind("change:referrer", function() {
                self.renderElement();
            });
        },

        renderElement: function() {
            this._super();
            if (this.pos.config.inventory_adjustment) {
                this.update_ui_for_inventory_adjustment();
            }
        },

        update_ui_for_inventory_adjustment: function() {
            var self = this;
            this.$(".button.set-customer")
                .off()
                .hide();
            this.$(".button.pay")
                .off()
                .click(function() {
                    self.gui.show_popup("confirm", {
                        title: _t("Inventory Validation"),
                        body: _t(
                            "Are you sure you want to Validate current inventory stage?"
                        ),
                        confirm: function() {
                            if (!self.pos.get_order().inventory_adjustment_stage_id) {
                                return self.gui.show_popup("error", {
                                    title: "Inventory Stage",
                                    body:
                                        "This order is not an Inventory Stage, Please create a new stage to continue",
                                });
                            }
                            self.pos.send_inventory_stage().then(
                                function(res) {
                                    if (res.error) {
                                        return self.gui.show_popup("error", {
                                            title: res.error.title,
                                            body: res.error.message,
                                        });
                                    }
                                    self.gui.close_popup();
                                    self.pos.get_order().destroy({reason: "abandon"});
                                },
                                function(err) {
                                    console.log(err);
                                }
                            );
                        },
                    });
                });
            this.$('.numpad button[data-mode="discount"]').hide();
            this.$('.numpad button[data-mode="price"]').hide();
            this.$(".numpad button.numpad-minus").hide();
            // This.$('.numpad button[data-mode="discount"]').text('').off().addClass('disable');
            // this.$('.numpad button[data-mode="price"]').text('').off().addClass('disable');
            // this.$('.numpad button.numpad-minus').text('').off().addClass('disable');
        },
    });

    screens.NumpadWidget.include({
        clickDeleteLastChar: function() {
            var user_is_admin = _.contains(
                this.pos.get_cashier().groups_id,
                this.pos.config.group_system_id[0]
            );
            if (!this.pos.config.inventory_adjustment || user_is_admin) {
                return this._super();
            }
            return this.gui.show_popup("alert", {
                title: _t("Unable to Remove the Line"),
                body: _t("Ask an Administrator for it"),
            });
        },
    });

    screens.OrderWidget.include({
        init: function(parent, options) {
            this._super(parent, options);
            if (this.pos.config.inventory_adjustment) {
                $(this.chrome.el).addClass("inventory");
            }
        },
    });

    screens.ProductListWidget.include({
        get_product_image_url: function(product) {
            if (this.pos.config.inventory_adjustment) {
                return "";
            }
            return (
                window.location.origin +
                "/web/image?model=product.product&field=image_medium&id=" +
                product.id
            );
        },
    });

    gui.Gui.include({
        _close: function() {
            this._super();
            if (this.pos.config.inventory_adjustment) {
                new Model(
                    "pos.config"
                ).call("close_and_validate_entries_on_pos_closing", [
                    [],
                    this.pos.pos_session.id,
                ]);
            }
        },
    });

    return {
        NewStageButton: NewStageButton,
        UpdateStageButton: UpdateStageButton,
        NewInventoryPopupWidget: NewInventoryPopupWidget,
        InventorySelectionPopupWidget: InventorySelectionPopupWidget,
    };
});
