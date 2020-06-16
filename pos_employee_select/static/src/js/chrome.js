odoo.define("pos_employee_select.chrome", function(require) {
    "use strict";

    var chrome = require("point_of_sale.chrome");
    var core = require("web.core");
    var _t = core._t;

    chrome.UsernameWidget.include({
        click_username: function() {
            this._super();
            this.gui.current_popup.options.title = _t("Change Salesperson");
            this.gui.current_popup.renderElement();
        },
    });

    return chrome;
});
