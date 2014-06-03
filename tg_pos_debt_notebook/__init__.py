from openerp.addons.point_of_sale.controllers import main as pos_controller
pos_controller.html_template = pos_controller.html_template.replace('/keyboard.css" />', '/keyboard.css" />\n<link rel="stylesheet" href="/tg_pos_debt_notebook/static/src/css/tg_pos.css" />')
