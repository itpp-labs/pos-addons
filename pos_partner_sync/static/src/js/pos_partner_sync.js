/* Copyright (c) 2004-2015 Odoo S.A.
 * Copyright 2018-2019 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_partner_sync.pos', function (require) {

    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var gui = require('point_of_sale.gui');
    var rpc = require('web.rpc');

    var QWeb = core.qweb;
    var _t = core._t;

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            PosModelSuper.prototype.initialize.apply(this, arguments);
            var self = this;
            this.ready.then(function () {
                self.bus.add_channel_callback("pos_partner_sync", self.on_barcode_updates, self);
            });
        },
        on_barcode_updates: function(data){
            var self = this;
            if (data.message === 'update_partner_fields' && data.partner_ids && data.partner_ids.length) {
                if (data.action && data.action === 'unlink') {
                    this.remove_unlinked_partners(data.partner_ids);
                    this.update_templates_with_partner(data.partner_ids);
                } else {
                    this.load_new_partners_force_update(data.partner_ids).then(function(){
                        self.update_templates_with_partner(data.partner_ids);
                    });
                }
            }
        },

        update_templates_with_partner: function(partner_ids) {
            if (!partner_ids) {
                return;
            }
            var client_list_screen = this.gui.screen_instances.clientlist;
            // updates client list cache
            client_list_screen.update_partner_cache(partner_ids);
            // updates, renders client details, renders client list
            if (this.gui.get_current_screen() === 'clientlist'){
                client_list_screen.update_client_list_screen(partner_ids);
            }
            // updates, renders order client
            var order = this.get_order();
            var client = this.get_client();
            if (order && client && _.contains(partner_ids, client.id)) {
                client = this.db.get_partner_by_id(client.id);
                order.set_client(client);
            }
        },

        load_new_partners_force_update: function(ids) {
            // quite similar to load_new_partners but loads only required partners and do it forcibly (see the comment below)
            var def = new $.Deferred();
            if (!ids) {
                return def.reject();
            }
            var self = this;
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

                // we add this trick with get_partner_write_date to be able to process several updates within the second
                // it is restricted by built-in behavior in add_partners function
                self.db.partner_write_date = 0;
                // returns default value "1970-01-01 00:00:00"
                self.db.get_partner_write_date();
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

    screens.ClientListScreenWidget.include({
        update_partner_cache: function(partner_ids) {
            var self = this;
            var partner = {};
            _.each(partner_ids, function(pid){
                partner = self.pos.db.get_partner_by_id(pid);
                if (!partner) {
                    return;
                }
                var clientline_html = '';
                var clientline = self.partner_cache.get_node(partner.id);
                if(clientline){
                    clientline_html = QWeb.render('ClientLine',{widget: self, partner:partner});
                    clientline = document.createElement('tbody');
                    clientline.innerHTML = clientline_html;
                    clientline = clientline.childNodes[1];
                    self.partner_cache.cache_node(partner.id,clientline);
                }
            });
        },
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
