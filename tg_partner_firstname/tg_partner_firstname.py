# -*- coding: utf-8 -*-
#
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
#

import logging
from openerp import fields, models

_logger = logging.getLogger(__name__)


class InheritResPartner(models.Model):
    _name = 'res.partner'
    _inherit = 'res.partner'

    def write(self, cr, uid, ids, vals, context=None):
        v_name = None
        v_firstname = None

        if vals.get('name'):
            # name to Uppercase
            v_name = vals['name'].strip()
            vals['name'] = v_name.upper()

        if vals.get('firstname'):
            # firstname capitalized
            v_firstname = vals['firstname'].strip()
            vals['firstname'] = v_firstname.title()

        result = super(InheritResPartner, self).write(cr, uid, ids, vals, context=context)
        return result

    def create(self, cr, uid, vals, context=None):
        v_name = None
        v_firstname = None

        if vals.get('name'):
            # name to Uppercase
            v_name = vals['name'].strip()
            vals['name'] = v_name.upper()

        if vals.get('firstname'):
            # firstname capitalized
            v_firstname = vals['firstname'].strip()
            vals['firstname'] = v_firstname.title()

        result = super(InheritResPartner, self).create(cr, uid, vals, context=context)
        return result


        'firstname': fields.Char('Firstname', size=128),

