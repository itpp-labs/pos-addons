/* Copyright 2018 Ivan Yelizariev <https://it-projects.info/team/yelizariev>
   License MIT (https://opensource.org/licenses/MIT). */
odoo.define("pos_qr_show", function (require) {
    "use strict";

    var models = require("point_of_sale.models");

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        render_html_for_customer_facing_display: function () {
            var res = PosModelSuper.prototype.render_html_for_customer_facing_display.apply(
                this,
                arguments
            );
            var order = this.get_order();
            if (!order || !order.payment_qr) {
                return res;
            }
            return res.then(function (rendered_html) {
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
                    function (memory, current_element) {
                        return memory + $(current_element).prop("outerHTML");
                    },
                    ""
                    // Initial memory of ""
                );

                return rendered_html;
            });
        },
    });
});
