odoo.define('pos_longpolling.CrossTab', function (require) {
    "use strict";

    var CrossTab = require('bus.CrossTab');

    CrossTab.include({
        _heartbeat: function() {
            this._super();
            // https://github.com/odoo/odoo/pull/28092
            var hbPeriod = this.TAB_HEARTBEAT_PERIOD;
            if (this._isMasterTab) {
                hbPeriod = this.MASTER_TAB_HEARTBEAT_PERIOD;
            }
            if (this._heartbeatTimeout) {
                clearTimeout(this._heartbeatTimeout);
            }
            this._heartbeatTimeout = setTimeout(this._heartbeat.bind(this), hbPeriod);
        }
    });

    return CrossTab;

});
