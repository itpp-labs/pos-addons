odoo.define('pos_mobile.mobile', function (require) {
    "use strict";

    var models = require('point_of_sale.models');

    var PosModelSuper = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            this.is_mobile = odoo.is_mobile;
//            $('body').css({
//                height: '100%',
//                width: '100%',
//                position: 'fixed',
//                margin: 0
//            });
            return PosModelSuper.initialize.call(this, session, attributes);
        },
    });
});
