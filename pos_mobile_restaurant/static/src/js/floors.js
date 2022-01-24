odoo.define("pos_mobile_restaurant.floors", function(require) {
    "use strict";

    if (!odoo.is_mobile) {
        return;
    }

    var floors = require("pos_restaurant.floors");
    var core = require("web.core");

    var _t = core._t;

    floors.FloorScreenWidget.include({
        click_floor_button: function(event, $el) {
            this._super(event, $el);
            var id = $el.data("id");
            // Var floor = this.pos.floors_by_id[id];
            var slide = $("div[data-id=" + id + "][id=slide-floor]").index();
            this.chrome.swiper_floors.slideTo(slide);
        },
        save_current_floor_changes_data: function() {
            if (this.get_current_data) {
                var collection = this.get_current_data();
                this.pos.saved_floors_data[this.floor.id] = JSON.stringify(collection);
            }
        },
        compare_current_floor_data: function() {
            if (this.get_current_data) {
                var collection = this.get_current_data();
                return (
                    this.pos.saved_floors_data[this.floor.id] ===
                    JSON.stringify(collection)
                );
            }
            return false;
        },
        renderElement: function() {
            if (this.compare_current_floor_data()) {
                return false;
            }
            this._super();
            var map = this.$el.find(".floor-map");
            var slide = this.get_floor_slide_by_id(this.floor.id);
            if (slide.length) {
                // Replace exist slide
                slide.find(".floor-map").replaceWith(map);
            } else {
                // Append new slide
                this.chrome.swiper_floors.appendSlide(
                    '<div class="swiper-slide slide-floor" id="slide-floor" data-id=' +
                        this.floor.id +
                        "></div>"
                );
                slide = this.get_floor_slide_by_id(this.floor.id);
                slide.append(map);
            }
            this.save_current_floor_changes_data();
        },
        get_floor_slide_by_id: function(id) {
            return $(".swiper-slide.slide-floor[data-id=" + id + "]");
        },
    });

    floors.TableWidget.include({
        //  Different from Original: remove all styles specific for each table
        table_style: function() {
            var table = this.table;
            var style = {};
            if (table.color) {
                style.background = table.color;
            }
            if (table.height >= 300 && table.width >= 300) {
                style["font-size"] = "64px";
            }
            return style;
        },
        destroy: function() {
            if (this.$el && this.$el.hasClass("table")) {
                return;
            }
            this._super();
        },
        renderElement: function() {
            /*
                The 'drag' events in original code was added because on touch devices it is sometimes
                not easy to click, especially on small elements. You have to touch and
                release the screen without moving your finger.

                The pos_mobile_restaurant module adds scroll to table view, so we need to remove the 'drag' event
                to make it work.

                TODO: Make it without removing events
            */
            this._super();
            this.$el.off("dragstart");
            this.$el.off("drag");
            this.$el.off("dragend");
        },
    });

    floors.TableGuestsButton.include({
        button_click: function() {
            var self = this;
            if (this.pos.get_order()) {
                this._super();
            } else {
                this.gui.show_popup("number", {
                    title: _t("Guests ?"),
                    cheap: true,
                    value: 0,
                    confirm: function(value) {
                        value = Math.max(1, Number(value));
                        self.pos.add_new_order();
                        self.pos.get_order().set_customer_count(value);
                        self.renderElement();
                    },
                    cancel: function() {
                        self.pos.table = null;
                    },
                });
            }
        },
    });

    return floors;
});
