# -*- coding: utf-8 -*-
import logging
import simplejson
import os
import openerp
import time
import random

from openerp import http
from openerp.http import request
from openerp.addons.web.controllers.main import module_boot, login_redirect

_logger = logging.getLogger(__name__)

class PosController(http.Controller):

    @http.route('/pos/web_debug', type='http', auth='none')
    def a(self, debug=True, **k):

        if not request.session.uid:
            return login_redirect()

        values = {
            'modules': simplejson.dumps(module_boot(request.db)),
            'init': """
                     var wc = new s.web.WebClient();
                     wc.show_application = function(){
                         wc.action_manager.do_action("pos.ui");
                     };
                     wc.appendTo($(document.body));
                     """
        }
        return request.render('point_of_sale_debug.web', values)
