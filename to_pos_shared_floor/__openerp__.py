# -*- coding: utf-8 -*-
#
#
#    @package to_pos_shared_floor TO POS Shared Floor for Odoo 9.0
# @copyright Copyright (C) 2015 T.V.T Marine Automation (aka TVTMA). All rights reserved.#
#    @license http://www.gnu.org/licenses GNU Affero General Public License version 3 or later; see LICENSE.txt
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
#
{
    'name': 'TO POS Shared Floor',
    'version': '1.0.0',
    'author': 'T.V.T Marine Automation (aka TVTMA), IT-Projects LLC',
    "support": "apps@it-projects.info",
    'website': 'http://ma.tvtmarine.com',
    'summary': 'Allow share multi floors to PoSes',
    'sequence': 24,
    'category': 'Point Of Sale',
    'description': """
Enable to share multiple floors to PoSes:
==================================

    """,
    'depends': ['pos_restaurant'],
    'data': [
        'views/restaurant_view.xml',
        'views/templates.xml',
    ],
    'demo': ['demo.xml'],
    'installable': True,
}
