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

import logging
import time
from datetime import datetime, timedelta
from openerp import netsvc, tools, pooler
from openerp.osv import fields, osv
from openerp.tools.translate import _


_logger = logging.getLogger(__name__)

class pos_message(osv.Model):
    _name = 'pos.message'

    _columns = {
        'pos_ids' : fields.many2many('pos.config', 
                                    'pos_message_config_rel', 
                                    'message_id', 
                                    'config_id', 
                                    'Point of Sale'),
        'title' : fields.char('Title', size=128, required=True),
        'active': fields.boolean('Active'),
        'message_type': fields.selection([
                                (1, 'Information'),
                                (2, 'Question'),
                                (3, 'Alert'),
                                (4, 'Warning'),
                                (5, 'Other')
                                ], 
                                'Type',
            help="Select the type of the message to be displayed on POS"),
        'message' : fields.text('Message', required=True),
        'start_at' : fields.date('Starting Date', required=True), 
        'stop_at' : fields.date('Ending Date', required=True),
        'frequency': fields.selection([
                                        (1, 'Once'),
                                        (2, 'Every X hours'),
                                        ], 
                                        'Frequency',
                    help="Set the frequency of occurrence of the message"),
        'interval' : fields.selection([
                                        (1, '1'),
                                        (2, '2'),
                                        (3, '3'),
                                        (4, '4'),
                                        ], 
                                        'Interval',
                    help="Display message each x hours"),
    }

    _defaults = {
        'message_type' : 1,
        'frequency' : 1,
        'interval': 1,
        'active': True,
        'start_at': fields.date.context_today,
        'stop_at': fields.date.context_today,
    }
    
    # get available messags for the POS
    def get_available_message(self, cr, uid, posid, context=None):
        if context is None:
            context = {}

        date_now = time.strftime("%Y-%m-%d")
        date_time_now = time.strftime("%Y-%m-%d %H:%M:%S")
        res = {}
        default_res = {
            'm_id': None,
            'm_type': 0,
            'm_title': None,
            'm_content': None
        }
        
        messages_ids = self.search(cr, uid, [
                                            ('active', '=', True), 
                                            ('start_at', '<=', date_now),
                                            ('stop_at', '>=', date_now),
                                            ('pos_ids', '=', posid)
                                            ])
        _logger.info('messages_ids : %r', messages_ids)
        if messages_ids:
            
            for m_id in messages_ids:
                
                message = self.browse(cr, uid, m_id, context=context)
                
                m_title = _(message.title)
                m_type = message.message_type
                m_frequency = int(message.frequency)
                m_interval = int(message.interval)
                m_message = message.message
                
                res = {
                    'm_id': m_id,
                    'm_type': m_type,
                    'm_title': m_title,
                    'm_content': m_message
                }
                
                if m_frequency == 1:
                    nb_read_max = 1
                    
                else:
                    nb_read_max = 24
           
                date_read_start = time.strftime("%Y-%m-%d 00:00:00")
                date_read_stop = time.strftime("%Y-%m-%d 23:59:00")
                
                obj_read = self.pool.get('pos.message.read')
                read_ids = obj_read.search(cr, uid, [
                                                    ('pos_id', '=', posid),
                                                    ('message_id', '=', m_id),
                                                    ('date_read', '>', date_read_start),
                                                    ('date_read', '<', date_read_stop)
                                                    ])
                
                if read_ids:
                    
                    # once
                    if nb_read_max == 1:
                        res = default_res
                        continue                       

                    message_read = obj_read.browse(cr, uid, read_ids[0], context=context)   
                    mr_date_plus = datetime.strptime(message_read.date_read, "%Y-%m-%d %H:%M:%S") + timedelta(hours=m_interval)   
                    mr_date_now = datetime.strptime(date_time_now, "%Y-%m-%d %H:%M:%S")

                    if mr_date_now >= mr_date_plus :
                        break
                    else:
                        res = default_res
                        continue
                else:
                    break
                    
        else:
            res = default_res
        
        return res  
                                    

class pos_message_read(osv.Model):
    _name = 'pos.message.read'
    _order = 'pos_id, date_read desc'

    _columns = {
        'message_id' : fields.integer('Message id'),
        'pos_id' : fields.integer('POS id'),
        'date_read' : fields.datetime('Date read'),
    }
    
    def write_pos_message_read(self, cr, uid, mid, posid, context=None):
        if context is None:
            context = {}
        
        date_now = time.strftime("%Y-%m-%d %H:%M:%S")
        read_id = self.create(cr, uid, {'message_id' : mid, 'pos_id' : posid, 'date_read': date_now}, context=context)
        return read_id



class inherit_pos_config(osv.Model):
    _name = 'pos.config'
    _inherit = 'pos.config'

    _columns = {
        'message_ids': fields.many2many('pos.message', 
                                        'pos_message_config_rel', 'config_id', 
                                        'message_id', 
                                        'Messages'), 
    }
    
                        
                
                
            
            