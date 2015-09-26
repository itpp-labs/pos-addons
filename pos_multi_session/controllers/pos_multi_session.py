import openerp
from openerp.http import request

try:
    from openerp.addons.bus.bus import Controller as BusController
except ImportError:
    pass

class Controller(BusController):
    def _poll(self, dbname, channels, last, options):
        if request.session.uid:
            channels.append((request.db, 'pos.multi_session', request.uid))
        return super(Controller, self)._poll(dbname, channels, last, options)


    @openerp.http.route('/pos_multi_session/update', type="json", auth="public")
    def multi_session_update(self, multi_session_id, message):
        res = request.env["pos.multi_session"].browse(int(multi_session_id)).broadcast(message)
        return res
