/* Copyright (c) 2004-2015 Odoo S.A.
 * Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
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
            this.bus.add_channel_callback("pos_barcode_sync", this.on_barcode_updates, this);
        },
        on_barcode_updates: function(data){
            var self = this;
            if (data.message === 'update_partner_barcode') {
                PosModelSuper.prototype.load_new_partners.apply(this).done(function(){
                    var opened_client_list_screen = self.gui.get_current_screen() === 'clientlist' && self.gui.screen_instances.clientlist;
                    if (opened_client_list_screen){
                        opened_client_list_screen.update_client_list_screen(data.partner_ids);
                    }
                });
            }
        },
    });

    gui.Gui.prototype.screen_classes.filter(function(el) {
        return el.name === 'clientlist';
    })[0].widget.include({
        update_client_list_screen: function(partner_ids){
            var partner = this.new_client || this.old_client;
            if (partner){
                if (_.contains(partner_ids, partner.id)) {
                    partner = this.pos.db.get_partner_by_id(partner.id);
                    this.display_client_details('show', partner);
                }
                this.old_client = partner;
            }
            this.render_list(this.pos.db.get_partners_sorted(1000));
            this.old_client = this.pos.get_client();
        },
    });
});
