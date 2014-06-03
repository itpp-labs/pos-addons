# -*- coding: utf-8 -*-

import tg_pos_enhanced

from openerp.addons.point_of_sale.controllers import main as pos_controller
pos_controller.html_template = pos_controller.html_template.replace('/pos.css" />', '/pos.css" />\n<link rel="stylesheet" href="/tg_pos_enhanced/static/src/css/tg_pos.css" />')
