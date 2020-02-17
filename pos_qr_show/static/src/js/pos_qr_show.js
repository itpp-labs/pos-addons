/* Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_qr_show", function(require) {
    "use strict";

    var rpc = require("web.rpc");
    var core = require("web.core");
    var models = require("point_of_sale.models");
    var screens = require("point_of_sale.screens");
    var gui = require("point_of_sale.gui");
    var session = require("web.session");

    var _t = core._t;

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        on_payment_qr: function(order, payment_qr) {
            // TODO shall we save type of qr too?
            // TODO check that order is current order
            order.payment_qr = payment_qr;
            this.show_payment_qr_on_payment_screen(payment_qr);
            if (this.config.iface_customer_facing_display) {
                this.send_current_order_to_customer_facing_display();
            }
        },
        show_payment_qr_on_payment_screen: function(payment_qr) {
            this.hide_payment_qr_on_payment_screen();
            /* EcLevel -- Error Correction Level
               L - Low (7%)
               M - Medium (15%)
               Q - Quartile (25%)
               H - High (30%)

               For more options see https://larsjung.de/jquery-qrcode/
            */
            $(".qr-container").qrcode({
                text: payment_qr,
                ecLevel: "H",
                size: 400,
            });
        },
        hide_payment_qr_on_payment_screen: function() {
            $(".qr-container").empty();
        },
        render_html_for_customer_facing_display: function() {
            var self = this;
            var res = PosModelSuper.prototype.render_html_for_customer_facing_display.apply(
                this,
                arguments
            );
            var order = this.get_order();
            if (!order || !order.payment_qr) {
                return res;
            }
            return res.then(function(rendered_html) {
                var $rendered_html = $(rendered_html);

                var $elem = $rendered_html.find(".pos-adv");
                $elem.qrcode({
                    render: "image",
                    text: order.payment_qr,
                    ecLevel: "H",
                    size: 400,
                });
                var image64 = $elem.find("img").attr("src");
                $elem.find("img").remove();
                $elem.css("background-image", "url(" + image64 + ")");
                $rendered_html
                    .find(".pos-payment_info")
                    .css("background-color", "#888");

                // Prop only uses the first element in a set of elements,
                // and there's no guarantee that
                // customer_facing_display_html is wrapped in a single
                // root element.
                rendered_html = _.reduce(
                    $rendered_html,
                    function(memory, current_element) {
                        return memory + $(current_element).prop("outerHTML");
                    },
                    ""
                ); // Initial memory of ""

                return rendered_html;
            });
        },
    });
});
