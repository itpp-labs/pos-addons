odoo.define('pos_mobile.screens', function (require) {
    "use strict";

    var screens = require('point_of_sale.screens');

    screens.ProductScreenWidget.include({
        renderElement: function () {
            this._super.apply(this, arguments);
            this.pos.ready.then(function(){
                var swipe = $("#mySwipe");
                var div = swipe.find(".swipe");
                div.detach();
                swipe.prepend(div);

                var element = document.getElementById('mySwipe');
                window.mySwipe = new Swipe(element, {
                    startSlide: 1,
                    auto: false,
                    draggable: true,
                    autoRestart: false,
                    continuous: false,
                    disableScroll: true,
                    stopPropagation: true,
                    callback: function(index, element) {},
                    transitionEnd: function(index, element) {}
                });

                var rightpane = $(".rightpane tbody");
                var tr = rightpane.find(".header-row");
                tr.detach();
                rightpane.append(tr);
            });
        },
    });
    return screens;
});
