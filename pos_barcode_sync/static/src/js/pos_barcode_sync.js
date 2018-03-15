odoo.define('pos_barcode_sync.pos', function (require) {

    var session = require('web.session');
    var Backbone = window.Backbone;
    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var longpolling = require('pos_longpolling');
    var gui = require('point_of_sale.gui');

    var _t = core._t;

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.bus.add_channel_callback("pos_barcode_sync", this.update_partners, this);
            this.on('updatePartnerBarcode', function(partner_id){
                session.rpc('/barcode/update', {message: 'Update Partner Barcode', partner_id: partner_id}, {shadow : true});
            })
        },
        on_partner_barcode_update: function(data){
            var self = this;
            PosModelSuper.prototype.load_new_partners.apply(this, arguments).done(function(){
                var client_list_screen = self.gui.screen_instances.clientlist;
                if (client_list_screen){
                    client_list_screen.update_opened_partner_details(data.partner_id);
                }
            });
        },
    });

    gui.Gui.prototype.screen_classes.filter(function(el) {
        return el.name === 'clientlist';
    })[0].widget.include({
        saved_client_details: function(partner_id){
            var partner = this.pos.db.get_partner_by_id(partner_id);
            var old_barcode = partner.barcode;
            this._super(partner_id);
            var new_barcode = this.$('.client-details-contents .detail.barcode').fieldValue()[0] || false;
            if (new_barcode !== old_barcode){
                this.pos.trigger("updatePartnerBarcode", partner.id)
            }
        },
        update_opened_partner_details: function(partner_id){
            if (this.$el.not('.oe_hidden')[0]) {
                var partner = this.new_client || this.old_client;
                if (partner && partner_id === partner.id){
                    this.$el.find('.client-detail:contains("Barcode") .detail.client-id').text(
                        this.pos.db.get_partner_by_id(partner_id).barcode
                    );
                }
            }
        },
    });
});
