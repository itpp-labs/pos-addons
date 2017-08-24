# -*- coding: utf-8 -*-
from odoo import http
import logging
import time
import traceback
from ast import literal_eval


_logger = logging.getLogger(__name__)


try:
    from odoo.addons.hw_escpos.escpos import escpos
    from odoo.addons.hw_escpos.controllers.main import EscposProxy
    from odoo.addons.hw_escpos.controllers.main import EscposDriver
    from odoo.addons.hw_escpos.escpos.exceptions import NoDeviceError, HandleDeviceError, TicketNotPrinted, NoStatusError
    from odoo.addons.hw_escpos.escpos.printer import Network
    import odoo.addons.hw_escpos.controllers.main as hw_escpos_main
except ImportError:
    EscposProxy = object


class UpdatedEscposDriver(EscposDriver):

    def __init__(self):
        self.network_printers = False
        self.usb_printer_active = False
        self.run_network_connection()
        super(UpdatedEscposDriver, self).__init__()

    def run_network_connection(self):
        while self.network_printers and len(self.network_printers) > 0:
            driver.network_printers = self.connected_network_printers(self.network_printers)
            time.sleep(5)

    def connected_network_printers(self, printers):
        printer = False
        if printers and len(printers) > 0:
            network_printers = []
            for p in printers:
                if type(p) is str:
                    p = literal_eval(p)
                try:
                    printer = UpdatedNetwork(p['ip'])
                    printer.close()
                    p['status'] = 'online'
                except:
                    p['status'] = 'offline'
                if printer:
                    printer.close()
                network_printers.append({
                    'ip': str(p['ip']),
                    'status': str(p['status']),
                    'name': str(p['name'])
                })
            return network_printers
        return printers

    def run(self):
        printer = None
        if not escpos:
            _logger.error('ESC/POS cannot initialize, please verify system dependencies.')
            return
        while True:
            try:
                error = True
                timestamp, task, data = self.queue.get(True)
                printer = None
                if len(task) == 2:
                    if task[0] == 'network_xml_receipt':
                        if timestamp >= time.time() - 1 * 60 * 60:
                            network_printer_proxy = task[1]
                            # print in network printer
                            printer = UpdatedNetwork(network_printer_proxy)
                            printer.receipt(data)
                else:
                    if self.usb_printer_active:
                        printer = self.get_escpos_printer()
                    elif self.network_printers:
                        self.set_status('connected', 'Connected')
                if printer is None:
                    if self.usb_printer_active is False:
                        if self.network_printers:
                            self.set_status('connected', 'Connected')
                        else:
                            if task != 'status':
                                self.queue.put((timestamp, task, data))
                    elif self.usb_printer_active is True:
                        if task != 'status':
                            self.queue.put((timestamp, task, data))
                    error = False
                    time.sleep(5)
                    continue
                elif task == 'receipt':
                    if timestamp >= time.time() - 1 * 60 * 60:
                        self.print_receipt_body(printer, data)
                        printer.cut()
                elif task == 'xml_receipt':
                    if timestamp >= time.time() - 1 * 60 * 60:
                        printer.receipt(data)
                elif task == 'cashbox':
                    if timestamp >= time.time() - 12:
                        self.open_cashbox(printer)
                elif task == 'printstatus':
                    self.print_status(printer)
                elif task == 'status':
                    pass
                error = False

            except NoDeviceError as e:
                _logger.error("No device found %s" % str(e))
            except HandleDeviceError as e:
                _logger.error("Impossible to handle the device due to previous error %s" % str(e))
            except TicketNotPrinted as e:
                _logger.error("The ticket does not seems to have been fully printed %s" % str(e))
            except NoStatusError as e:
                _logger.error("Impossible to get the status of the printer %s" % str(e))
            except Exception as e:
                self.set_status('error', str(e))
                errmsg = str(e) + '\n' + '-'*60+'\n' + traceback.format_exc() + '-'*60 + '\n'
                _logger.error(errmsg)
            finally:
                if error:
                    self.queue.put((timestamp, task, data))
                if printer:
                    printer.close()


driver = UpdatedEscposDriver()
hw_escpos_main.driver = driver
driver.push_task('printstatus')


class UpdatedEscposProxy(EscposProxy):
    @http.route('/hw_proxy/print_xml_receipt', type='json', auth='none', cors='*')
    def print_xml_receipt(self, receipt, proxy=None):
        if proxy:
            driver.push_task(['network_xml_receipt', proxy], receipt)
        else:
            super(UpdatedEscposProxy, self).print_xml_receipt(receipt)

    @http.route('/hw_proxy/network_printers', type='json', auth='none', cors='*')
    def networ_printers(self, network_printers=None):
        network_printers = list(set([str(e) for e in network_printers]))
        for i in range(len(network_printers)):
            network_printers[i] = literal_eval(network_printers[i])
        driver.network_printers = network_printers
        driver.run_network_connection()

    @http.route('/hw_proxy/status_network_printers', type='json', auth='none', cors='*')
    def networ_printers_status(self):
        return driver.network_printers

    @http.route('/hw_proxy/without_usb', type='http', auth='none', cors='*')
    def without_usb(self):
        driver.usb_printer_active = False
        return "ping"

    @http.route('/hw_proxy/hello', type='http', auth='none', cors='*')
    def hello(self):
        driver.usb_printer_active = True
        return super(UpdatedEscposProxy, self).hello()


class UpdatedNetwork(Network):
    def close(self):
        """ Close TCP connection """
        if self.device:
            self.device.close()
