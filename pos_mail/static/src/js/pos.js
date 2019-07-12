/* Copyright 2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_mail.pos', function (require) {

    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var rpc = require('web.rpc');
    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;

    screens.ReceiptScreenWidget.include({
        show: function() {
            this._super();
            this.able_mail_button();
        },

        renderElement: function() {
            this._super();
            var self = this;
            if (this.pos.config.send_receipt_by_mail) {
                this.$('.button.mail_receipt').click(function(){
                    self.disable_mail_button();
                    self.mail_receipt_action();
                });
            }
        },

        able_mail_button: function() {
            return this.$('.button.mail_receipt').removeClass('disable');
        },

        disable_mail_button: function() {
            return this.able_mail_button().addClass('disable');
        },

        mail_receipt_action: function() {
            var self = this;
            var partner = this.pos.get_order().get_client();
            if (partner) {
                return this.send_mail_receipt(partner.id).done(function(res){
                    console.log("Mail's sent");
                }).fail(function(error){
                    self.gui.show_popup('error-traceback',{
                        'title': error.message || _t("Server Error"),
                        'body': error.data.debug || _t('The server encountered an error while trying to send the mail.'),
                    });
                    self.able_mail_button();
                });
            } else {
                this.set_mail_customer = true;
                this.$el.zIndex(-6);
                this.pos.gui.screen_instances.clientlist.show();
            }
        },

        send_mail_receipt: function(partner_id) {
            var receipt = QWeb.render('PosMailTicket', this.get_receipt_render_env());
            var order_name = this.pos.get_order().name;
            return rpc.query({
                model: 'pos.config',
                method: 'send_receipt_via_mail',
                args: [partner_id, receipt, order_name],
            }, {
                shadow: true,
            });
        },

        handle_auto_print: function() {
            if (this.check_autosend_mail_receipt() && !this.return_from_client_list) {
                this.return_from_client_list = false;
                this.mail_receipt_action();
                if (this.should_close_immediately()){
                    this.click_next();
                }
            } else {
                this._super();
            }
        },

        check_autosend_mail_receipt: function() {
            return this.should_auto_print() && this.pos.config.send_receipt_by_mail;
        },
    });

    screens.ClientListScreenWidget.include({
        save_changes: function(){
            var order = this.pos.get_order();
            if(this.has_client_changed() &&
               this.pos.config.send_receipt_by_mail &&
               this.gui.current_screen.set_mail_customer) {

                if (!this.new_client.email) {
                    this.gui.show_popup('error',{
                        'title': _t('Customer has no email address'),
                        'body': _t('Please add customer email or select another one'),
                    });
                    return;
                }
                var receipt_screen = this.gui.screen_instances.receipt;
                receipt_screen.send_mail_receipt(this.new_client.id);
                receipt_screen.$el.zIndex(0);
                this.$el.zIndex(-1);
            } else {
                this._super();
            }
        },
    });

    gui.Gui.include({
        back: function() {
            if(this.pos.get_order().finalized &&
               this.pos.config.send_receipt_by_mail &&
               this.current_screen.set_mail_customer) {
                // means we came there from the receipt screen
                var receipt_screen = this.screen_instances.receipt;
                var clientlist_screen = this.screen_instances.clientlist;
                clientlist_screen.close();
                clientlist_screen.$el.zIndex(-1);
                receipt_screen.set_mail_customer = false;
                receipt_screen.show();
                receipt_screen.$el.zIndex(0);
            } else {
                this._super();
            }
        },
    })

});
