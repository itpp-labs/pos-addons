odoo.define('pos_qr_login.popups', function (require) {
    "use strict";

    var PopupWidget = require('point_of_sale.popups');
    var gui = require('point_of_sale.gui');

    var BlockPopupWidget = PopupWidget.extend({
        template: 'BlockPopupWidget',
        show: function(options){
            var self = this;
            this._super(options);
            this.renderElement();
            this.$('.fa-lock').click(function(){
                self.click_unlock();
            });
        },
        click_unlock: function() {
            this.gui.close_popup();
            if (this.options.confirm) {
                this.options.confirm.call(self);
            }
        }
    });
    gui.define_popup({name:'block', widget: BlockPopupWidget});

    return BlockPopupWidget;
});
