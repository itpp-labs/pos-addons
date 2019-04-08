/* Copyright (c) 2004-2015 Odoo S.A.
 * Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_partner_sync.pos', function (require) {

    var session = require('web.session');
    var Backbone = window.Backbone;
    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var longpolling = require('pos_longpolling');
    var gui = require('point_of_sale.gui');
    var rpc = require('web.rpc');

    var _t = core._t;

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            PosModelSuper.prototype.initialize.apply(this, arguments);
            this.bus.add_channel_callback("pos_partner_sync", this.on_barcode_updates, this);
        },
        on_barcode_updates: function(data){
            var self = this;
            if (data.message === 'update_partner_fields') {
                var def = new $.Deferred();
                if (data.action && data.action === 'unlink') {
                    this.remove_unlinked_partners(data.partner_ids);
                    def.resolve();
                } else {
                    def = self.load_new_partners(data.partner_ids);
                }

                return def.done(function(){
                    var opened_client_list_screen = self.gui.get_current_screen() === 'clientlist' && self.gui.screen_instances.clientlist;
                    if (opened_client_list_screen){
                        opened_client_list_screen.update_client_list_screen(data.partner_ids);
                    }
                });
            }
        },

        load_new_partners: function(ids){
            if (!ids) {
                return PosModelSuper.prototype.load_new_partners.apply(this, arguments);
            }
            var self = this;
            var def = new $.Deferred();
            var model_name = 'res.partner';
            var fields = _.find(this.models,function(model){
                return model.model === model_name;
            }).fields;
            ids = Array.isArray(ids)
            ? ids
            : [ids];
            rpc.query({
                model: model_name,
                method: 'read',
                args: [ids, fields],
            }, {
                shadow: true,
            }).then(function(partners) {
                // check if the partners we got were real updates
                if (self.db.add_partners(partners)) {
                    def.resolve();
                } else {
                    def.reject();
                }
            }, function(err,event){
                if (err) {
                    console.log(err.stack);
                }
                event.preventDefault();
                def.reject();
            });
            return def;
        },

        remove_unlinked_partners: function(ids) {
            var self = this;
            var partner = false;
            var partner_sorted = this.db.partner_sorted;
            _.each(ids, function(id) {
                partner = self.db.get_partner_by_id(id);
                if (partner.barcode) {
                    delete self.db.partner_by_barcode[partner.barcode];
                }
                partner_sorted.splice(_.indexOf(partner_sorted, id), 1);
                delete self.db.partner_by_id[id];
            });
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
                    if (partner) {
                        this.display_client_details('show', partner);
                    } else {
                        // it's a case of an unlinked partner
                        this.show();
                    }
                }
                this.old_client = partner;
            }
            this.render_list(this.pos.db.get_partners_sorted(1000));
            this.old_client = this.pos.get_client();
        },
    });
});
