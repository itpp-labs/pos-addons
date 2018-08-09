/* Copyright 2018 Dinar Gabbasov <https://it-projects.info/team/GabbasovDinar>
* License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl.html). */
odoo.define('pos_cashbox.open', function (require) {
    "use strict";

    var WidgetButton = require('web.form_widgets').WidgetButton;
    var Session = require('web.Session');
    var Model = require('web.DataModel');
    var core = require('web.core');
    var CrashManager = require('web.CrashManager');

    var _t = core._t;


    WidgetButton.include({
        on_click: function(){
            var self = this;
            if (this.node.attrs.special === 'open_backend_cashbox'){
                var proxy_ip = this.view.datarecord.proxy_ip;
                if (!proxy_ip) {
                    return this.show_warning_message(_t('Connection Refused. Please check the IP address to PosBox'));
                }
                var url = this.get_full_url(proxy_ip);
                this.connect(url);
                this.open_cashbox().done(function(){
                    if (self.$el.hasClass('o_wow')) {
                        self.show_wow();
                    }
                }).fail(function(){
                    return self.show_warning_message(_t("Connection Refused. Please check the connection to CashBox"));
                });
            } else {
                this._super.apply(this, arguments);
            }
        },
        show_warning_message: function(message) {
            new CrashManager().show_warning({data: {
                exception_type: _t("Incorrect Operation"),
                message: message
            }});
        },
        get_full_url: function(current_url) {
            var port = ':8069';
            var url = current_url;
            if(url.indexOf('//') < 0){
                url = 'http://' + url;
            }
            if(url.indexOf(':',5) < 0){
                url += port;
            }
            return url;
        },
        connect: function(url) {
            this.connection = new Session(void 0, url, { use_cors: true});
        },
        open_cashbox: function(){
            var self = this;
            function send_opening_job(retries, done) {
                done = done || new $.Deferred();
                self.connection.rpc('/hw_proxy/open_cashbox').done(function(){
                    done.resolve();
                }).fail(function(){
                    if(retries > 0){
                        send_opening_job(retries-1,done);
                    }else{
                        done.reject();
                    }
                });
                return done;
            }
            return send_opening_job(3);
        },
    });
});
