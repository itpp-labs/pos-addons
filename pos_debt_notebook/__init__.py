import models
import init

from openerp import SUPERUSER_ID


def open_and_close_pos_session(cr, registry):
    pos_config_main = registry.get('ir.model.data').get_object_reference(cr, SUPERUSER_ID, 'point_of_sale', 'pos_config_main')[1]
    pos_config_obj = registry['pos.config']
    pos_session_obj = registry['pos.session']
    pos_config_obj.open_session_cb(cr, SUPERUSER_ID, [pos_config_main])
    pos_config_record = pos_config_obj.browse(cr, SUPERUSER_ID, [pos_config_main])
    pos_config_obj.open_existing_session_cb_close(cr, SUPERUSER_ID, [pos_config_main])
    pos_session_obj.wkf_action_close(cr, SUPERUSER_ID, [pos_config_record.current_session_id.id], {})
