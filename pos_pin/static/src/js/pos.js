odoo.define('pos_pin.pos', function (require) {
    "use strict";

    var gui = require('point_of_sale.gui');

    gui.Gui.include({
        sudo_custom: function(options) {
            var user = options.user || this.pos.get_cashier();
        
            if ($.inArray(options.special_group, user.groups_id) >= 0) {
                return new $.Deferred().resolve(user);
            } else {
                return this.select_user_custom({
                    'security': true,
                    'current_user': this.pos.get_cashier(),
                    'title': options.title,
                    'special_group': options.special_group
                });
            }
        },
        select_user_custom: function(options){
            options = options || {};
            var self = this;
            var def  = new $.Deferred();
    
            var list = [];
            for (var i = 0; i < this.pos.users.length; i++) {
                var user = this.pos.users[i];
                if ($.inArray(options.special_group, user.groups_id) >= 0) {
                    list.push({
                        'label': user.name,
                        'item':  user
                    });
                }
            }
    
            this.show_popup('selection',{
                'title': options.title || _t('Select User'),
                'list': list,
                'confirm': function(user){ def.resolve(user); },
                'cancel':  function(){ def.reject(); }
            });
    
            return def.then(function(user){
                if (options.security && user !== options.current_user && user.pos_security_pin) {
                    return self.ask_password(user.pos_security_pin).then(function(){
                        return user;
                    });
                } else {
                    return user;
                }
            });
        }
    });

});
