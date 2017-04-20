==========================
 Hardware Network Printer
==========================

Installation
============

* In POS Box: Comment out line 354 in hw_escpos/controllers/main.py, i.e. (replace ``driver.push_task('printstatus')`` to ``# driver.push_task('printstatus')``)
* In POS Box: add hw_printer_network module to server wide modules (``server_wide_modules`` in config file or ``--load`` parameter for run command) 
