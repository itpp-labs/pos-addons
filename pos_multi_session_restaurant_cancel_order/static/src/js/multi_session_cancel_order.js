odoo.define('pos_multi_session_cancel_order', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var chrome =  require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var multiprint = require('pos_restaurant.multiprint');
    var multisession = require('pos_multi_session');

    var MultiSessionSuper = multisession.MultiSession;
    multisession.MultiSession = multisession.MultiSession.extend({
        initialize: function(pos){
            this.cancelled_order_uid = false;
            MultiSessionSuper.prototype.initialize.apply(this, arguments);
        },
        send: function(message){
            if (message.action == 'remove_order' && message.data.cancelled) {
                this.cancelled_order_uid = message.data.uid;
            }
            if (message.action == 'update_order' && message.data.uid == this.cancelled_order_uid) {
                var next =  $.Deferred();
                return next.resolve();
            }
            return MultiSessionSuper.prototype.send.apply(this, arguments);
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        save_cancellation_order_to_server: function() {
            var self = this;
            this.order_is_cancelled = true;
            _super_order.save_cancellation_order_to_server.apply(this, arguments);
        },
        do_ms_remove_order: function(){
            if (this.order_is_cancelled) {
                this.pos.multi_session.remove_order({
                    'uid': this.uid,
                    'revision_ID': this.revision_ID,
                    'cancelled': this.order_is_cancelled
                });
            } else {
                _super_order.do_ms_remove_order.apply(this, arguments);
            }
        },
    });
});
