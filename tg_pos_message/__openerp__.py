# -*- coding: utf-8 -*-
##############################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2013 - Thierry Godin. All Rights Reserved
#    @author Thierry Godin <thierry@lapinmoutardepommedauphine.com>
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

{
    'name': 'TG POS Messaging',
    'version': '1.0.0',
    'category': 'Point Of Sale',
    'author': 'Thierry Godin',
    'summary': 'POS internal messaging',
    'description': """
Messaging in  Point Of Sale :
==============================

    - Schedule html messages to be displayed in POS


    """,
    'depends': ["base", "point_of_sale"],
    'data': [
        'tg_message_view.xml',
        'security/ir.model.access.csv',
    ],
    'qweb': [],
    'js': [],
    'css': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}
