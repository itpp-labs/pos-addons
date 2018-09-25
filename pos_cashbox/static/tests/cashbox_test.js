/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
* License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */

odoo.define('cashbox.cashbox_tests', function (require) {
    "use strict";

    var FormView = require('web.FormView');
    var testUtils = require('web.test_utils');

    var createView = testUtils.createView;

    QUnit.module('pos_cashbox', {
        beforeEach: function () {
            this.data = {
                'pos.session': {
                    fields: {
                        proxy_ip: {string: "IP Address", type: "char"}
                    },
                    records: [
                        {id: 1, proxy_ip: "localhost"},
                        {id: 2, proxy_ip: false}
                    ],
                    open_backend_cashbox: function () {
                        return true;
                    }
                }
            };
        }
    });

    QUnit.test('click cashbox button and send request to PosBox', function (assert) {
        // assert.expect(3);
        var form = createView({
            View: FormView,
            model: 'pos.session',
            data: this.data,
            arch:'<form>' +
                    '<sheet>' +
                        '<group>' +
                            '<field name="proxy_ip" invisible="1"/>' +
                            '<button name="open_backend_cashbox" icon="fa-archive" type="object" string="Open CashBox" class="oe_highlight cashbox_button" special="open_backend_cashbox"></button>' +
                        '</group>' +
                    '</sheet>' +
                '</form>',
            res_id: 1,
            mockRPC: function (route, args) {
                // assert.ok(route === 'http://localhost:8069/hw_proxy/open_cashbox', "Incorrectly PosBox URL: %s" % route);
                // assert.ok(args.method === 'open_backend_cashbox', "Cannot call method: %s" % args.method);
                if (route === 'http://localhost:8069/hw_proxy/open_cashbox' && args.method === 'open_backend_cashbox') {
                    // assert.ok(true, 'Could not open CashBox');
                    return $.when(true);
                }
                return this._super.apply(this, arguments);
            }
        });

        form.$('.cashbox_button').click();
        form.destroy();
    });

    QUnit.test('click cashbox button and send request to PosBox without ip', function (assert) {
        assert.expect(1);
        var form = createView({
            View: FormView,
            model: 'pos.session',
            data: this.data,
            arch:'<form>' +
                    '<sheet>' +
                        '<group>' +
                            '<field name="proxy_ip" invisible="1"/>' +
                            '<button name="open_backend_cashbox" icon="fa-archive" type="object" string="Open CashBox" class="oe_highlight cashbox_button" special="open_backend_cashbox"></button>' +
                        '</group>' +
                    '</sheet>' +
                '</form>',
            res_id: 2,
        });
        form.$('.cashbox_button').click();
        assert.ok(form.has('.o_dialog_warning').length , 'Not opening Warning Popup');
        form.destroy();
    });
});
