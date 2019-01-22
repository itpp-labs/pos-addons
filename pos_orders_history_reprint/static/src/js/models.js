/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
 * Copyright 2018 Kolushov Alexandr <https://it-projects.info/team/KolushovAlexandr>
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_orders_history_reprint.models', function (require) {
    "use strict";
    var models = require('pos_orders_history.models');
    var rpc = require('web.rpc');
    var longpolling = require('pos_longpolling.connection');

    var _super_pos_model = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function () {
            this.orders_history_receipt = [];
            _super_pos_model.initialize.apply(this, arguments);
            this.bus.add_channel_callback("pos_orders_history_receipt", this.on_orders_history_receipt_updates, this);
        },
        on_orders_history_receipt_updates: function(message) {
            var self = this;
            message.updated_receipts.forEach(function (id) {
                self.get_order_history_receipt(id).done(function(receipt) {
                    self.update_orders_history_receipt(receipt);
                });
            });
        },
        get_order_history_receipt: function (id) {
            return rpc.query({
                model: 'pos.xml_receipt',
                method: 'search_read',
                args: [[['id', '=', id]]]
            });
        },
        get_receipt_by_id: function(id) {
            return this.orders_history_receipt.find(function(receipt){
                return receipt.id === id;
            });
        },
        get_receipt_by_order_reference_and_type: function(reference, type) {
            return this.orders_history_receipt.find(function(receipt){
                return receipt.pos_reference === reference && receipt.receipt_type === type;
            });
        },
        update_orders_history_receipt: function (receipts) {
            var self = this;
            if (!(receipts instanceof Array)) {
                receipts = [receipts];
            }
            if (this.orders_history_receipt.length) {
                receipts.forEach(function(receipt) {
                    var exist_receipt = self.get_receipt_by_id(receipt.id);
                    if (exist_receipt) {
                        // TODO: update exist receipt
                        console.log('update exist receipt', receipt);
                    } else {
                        self.orders_history_receipt = self.orders_history_receipt.concat(receipt);
                    }
                });
            } else {
                this.orders_history_receipt = this.orders_history_receipt.concat(receipts);
            }
        }
    });

    models.load_models([{
        model: 'pos.xml_receipt',
        fields: ['id', 'receipt', 'pos_reference', 'receipt_type', 'status'],
        domain: function(self) {
            var orders = self.db.sorted_orders;
            var pos_reference = _.map(orders, function(order) {
                return order.pos_reference;
            });
            // load all receipts for the orders history
            return [['pos_reference','in',pos_reference]];
        },
        condition: function(self) {
            return self.config.orders_history && !self.config.load_barcode_order_only;
        },
        loaded: function (self, receipts) {
            if (receipts && receipts.length) {
                self.update_orders_history_receipt(receipts);
            }
        },
    }], {
        'after': 'pos.order'
    });

    return models;
});
