//  Copyright 2019 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
//  License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
odoo.define('pos_sale_coupons.db', function (require) {
    'use_strict';

    var PosDb = require('point_of_sale.DB');

    PosDb.include({
        init: function (options) {
            this._super(options);
            this.sale_coupons = [];
            this.sale_coupons_by_id = {};
            this.sale_coupon_programs = [];
            this.sale_coupon_programs_by_id = {};
            this.sale_old_coupons_list = [];
        },
        add_sale_coupons: function (coupons) {
            var self = this;
            _.each(coupons, function (coupon) {
                self.sale_coupons.push(coupon);
                self.sale_coupons_by_id[coupon.id] = coupon;
            });
        },
        update_sale_coupons: function(coupons) {
            var self = this;
            _.each(coupons, function (coupon) {
                self.sale_coupons_by_id[coupon.id] = coupon;
                // Search old coupon by id
                var old_coupon = self.sale_coupons.find(function(record) {
                    return record.id === coupon.id;
                });
                var index = self.sale_coupons.indexOf(old_coupon);
                // Update old coupon to new
                self.sale_coupons[index] = coupon;
                self.remove_old_coupon_id(coupon.id);
            });
        },
        update_old_coupon_ids: function(id) {
            if (id && this.sale_old_coupons_list.indexOf(id) === -1) {
                this.sale_old_coupons_list.push(id);
            }
        },
        remove_old_coupon_id: function(id) {
            var index = this.sale_old_coupons_list.indexOf(id);
            if (index !== -1) {
                this.sale_old_coupons_list.splice(index, 1);
            }
        },
        coupon_is_old: function(coupon) {
            return this.sale_old_coupons_list.indexOf(coupon.id) !== -1;
        },
        get_sale_coupon_by_id: function(id) {
            return this.sale_coupons_by_id[id];
        },
        get_sale_coupon_by_code: function(code) {
            return this.sale_coupons.find(function(coupon) {
                return coupon.code === code;
            });
        },
        add_sale_coupon_programs: function(programs) {
            var self = this;
            _.each(programs, function (program) {
                self.sale_coupon_programs.push(program);
                self.sale_coupon_programs_by_id[program.id] = program;
            });
        },
        get_sale_coupon_program_by_id: function(id) {
            return this.sale_coupon_programs_by_id[id];
        },

        update_sale_coupon_programs: function(coupon_programs) {
            var self = this;
            _.each(coupon_programs, function (coupon_program) {
                self.sale_coupon_programs_by_id[coupon_program.id] = coupon_program;
                // Search old coupon_program by id
                var old_coupon_program = self.sale_coupon_programs.find(function(record) {
                    return record.id === coupon_program.id;
                });
                var index = self.sale_coupon_programs.indexOf(old_coupon_program);
                // Update old coupon_program to new
                self.sale_coupon_programs[index] = coupon_program;
            });
        },
    });

    return PosDb;
});
